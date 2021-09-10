from datetime import datetime, timedelta
import json
import re
from typing import Callable, Dict, Set

from jinja2.exceptions import TemplateSyntaxError
from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta

from app.db import DBSession
from lib import metastore
from logic import admin as admin_logic

_DAG = Dict[str, Set[str]]


class QueryTemplatingError(Exception):
    pass


class UndefinedVariableException(QueryTemplatingError):
    pass


class QueryHasCycleException(QueryTemplatingError):
    pass


class QueryJinjaSyntaxException(QueryTemplatingError):
    pass


class LatestPartitionException(QueryTemplatingError):
    pass


# The first part is regex for single line comment, ie -- some comment
# the second part is for multi line comment, ie /* test */
comment_re = re.compile(r"((?:--.*)|(?:\/\*(?:.|\n)*?\*\/))", re.MULTILINE)


class TemplatedQueryRenderer(object):
    def __init__(self, engine_id: int = None):
        self.env = SandboxedEnvironment()
        self.engine_id = engine_id
        self.env.globals.update(latest_partition=self.create_get_latest_partition())

    @staticmethod
    def _escape_sql_comments(query: str):
        return re.sub(
            comment_re, lambda match: "{{ " + json.dumps(match.group()) + " }}", query
        )

    @staticmethod
    def _detect_cycle_helper(node: str, dag: _DAG, seen: Set[str]) -> bool:
        if node in seen:
            return True

        seen.add(node)

        children = dag.get(node, [])
        for child in children:
            if TemplatedQueryRenderer._detect_cycle_helper(child, dag, seen):
                return True
        seen.remove(node)
        return False

    @staticmethod
    def _detect_cycle(dag: _DAG) -> bool:
        seen = set()
        return any(
            TemplatedQueryRenderer._detect_cycle_helper(node, dag, seen)
            for node in dag.keys()
        )

    @staticmethod
    def get_default_variables():
        return {
            "today": datetime.today().strftime("%Y-%m-%d"),
            "yesterday": (datetime.today() - timedelta(1)).strftime("%Y-%m-%d"),
        }

    def create_get_latest_partition(self) -> Callable[[str, str], str]:
        metastore_loader = None
        with DBSession() as session:
            engine = admin_logic.get_query_engine_by_id(self.engine_id, session=session)
            metastore_id = engine.metastore_id if engine else None
            metastore_loader = (
                metastore.get_metastore_loader(metastore_id, session=session)
                if metastore_id is not None
                else None
            )

        def get_latest_partition(full_table_name: str, partition: str) -> str:
            """Returns latest partition function of a given table and partition key
                Args:
                full_table_name {str} - full table name in the format <schema_name>.<table_name>
                partition {str} - partition key

            Raises:
                LatestPartitionException: If unable to get latest partition with engine_id, partition, and full_table_name

            Returns:
                str - value of latest partition
            """
            full_table_name_parts = full_table_name.split(".")
            if not len(full_table_name_parts) == 2:
                raise LatestPartitionException(
                    f"Full table name '{full_table_name}' is invalid. Must be in the format <schema_name>.<table_name>"
                )
            [schema_name, table_name] = full_table_name_parts

            # metastore_loader only needs to be available for `get_latest_partition` function call,
            # so this check is made here
            if metastore_loader is None:
                raise LatestPartitionException(
                    f"Unable to load metastore for engine id {self.engine_id}"
                )

            latest_partition = metastore_loader.get_latest_partition(
                schema_name, table_name
            )
            if latest_partition:  # latest_partitions is like dt=2015-01-01/column1=val1
                for partition_col in latest_partition.split("/"):
                    partition_key, partition_val = partition_col.split("=")
                    if partition_key == partition:
                        return partition_val
            raise LatestPartitionException(
                f"Partitition '{partition}' not found on table '{full_table_name}'"
            )

        return get_latest_partition

    def get_templated_variables_in_string(self, s: str) -> Set[str]:
        """Find possible templated variables within a string

        Arguments:
            s {str}
        Returns:
            Set[str] - set of variable names
        """
        ast = self.env.parse(s)
        variables = meta.find_undeclared_variables(ast)

        # temporarily applying https://github.com/pallets/jinja/pull/994/files
        # since the current version is binded by flask
        filtered_variables = set()
        for variable in variables:
            if variable not in self.env.globals:
                filtered_variables.add(variable)

        return filtered_variables

    @staticmethod
    def verify_all_variables_are_defined(variables_required, variables_provided):
        for variable_name in variables_required:
            if variable_name not in variables_provided:
                raise UndefinedVariableException(
                    "Invalid variable name {}".format(variable_name)
                )

    def render_query_with_variables(self, s, variables):
        template = self.env.from_string(s)

        return template.render(**variables)

    def _flatten_variable(
        var_name: str,
        variable_defs: Dict[str, str],
        variables_dag: Dict[str, Set[str]],
        flattened_variables: Dict[str, str],
    ):
        """ Helper function for flatten_recursive_variables.
            Recursively resolve each variable definition
        """
        var_deps = variables_dag[var_name]
        for dep_var_name in var_deps:
            # Resolve anything that is not defined
            if dep_var_name not in flattened_variables:
                TemplatedQueryRenderer._flatten_variable(
                    dep_var_name, variable_defs, variables_dag, flattened_variables,
                )

        # Now all dependencies are solved
        env = SandboxedEnvironment(autoescape=False)
        template = env.from_string(variable_defs[var_name])
        flattened_variables[var_name] = template.render(
            **{
                dep_var_name: flattened_variables[dep_var_name]
                for dep_var_name in var_deps
            }
        )

    def flatten_recursive_variables(
        self, raw_variables: Dict[str, str]
    ) -> Dict[str, str]:
        """Given a list of variables, recursively replace variables that refers other variables

        Arguments:
            raw_variables {Dict[str, str]} -- The variable name/value pair
        Raises:
            UndefinedVariableException: If the variable refers to a variable that does not exist
            QueryHasCycleException: If the partials contains a cycle

        Returns:
            Dict[str, str] -- the variables replaced with other variables
        """
        flattened_variables = {}
        variables_dag = {}

        for key, value in raw_variables.items():
            if not value:
                value = ""

            variables_in_value = self.get_templated_variables_in_string(value)

            if len(variables_in_value) == 0:
                flattened_variables[key] = value
            else:
                for var_in_value in variables_in_value:
                    # Double check if the recursive referred variable is valid
                    if var_in_value not in raw_variables:
                        raise UndefinedVariableException(
                            "Invalid variable name: {}.".format(var_in_value)
                        )
                variables_dag[key] = variables_in_value

        if TemplatedQueryRenderer._detect_cycle(variables_dag):
            raise QueryHasCycleException(
                "Infinite recursion in variable definition detected."
            )

        # Resolve everything within the dag
        for var_name in variables_dag:
            TemplatedQueryRenderer._flatten_variable(
                var_name, raw_variables, variables_dag, flattened_variables
            )
        return flattened_variables

    def get_templated_query_variables(self, variables_provided):
        return self.flatten_recursive_variables(
            {**TemplatedQueryRenderer.get_default_variables(), **variables_provided,}
        )

    def render_templated_query(self, query: str, variables: Dict[str, str]) -> str:
        """Renders the templated query, with global variables such as today/yesterday and functions such as `latest_partition`.
        All the default html escape is ignore since it is not applicable.
        It also checks if a variable is a partial (in which it can refer other variables).


        Arguments:
            query {str} -- The query string that would get rendered
            raw_variables {Dict[str, str]} -- The variable name, variable value string pair

        Raises:
            UndefinedVariableException: If the variable refers to a variable that does not exist
            QueryHasCycleException: If the partials contains a cycle

        Returns:
            str -- The rendered string
        """
        try:
            escaped_query = TemplatedQueryRenderer._escape_sql_comments(query)
            variables_in_query = self.get_templated_variables_in_string(escaped_query)

            all_variables = self.get_templated_query_variables(variables)
            TemplatedQueryRenderer.verify_all_variables_are_defined(
                variables_in_query, all_variables
            )

            return self.render_query_with_variables(escaped_query, all_variables)
        except TemplateSyntaxError as e:
            raise QueryJinjaSyntaxException(f"Line {e.lineno}: {e.message}")
