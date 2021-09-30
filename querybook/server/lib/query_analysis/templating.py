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


def _escape_sql_comments(query: str):
    return re.sub(
        comment_re, lambda match: "{{ " + json.dumps(match.group()) + " }}", query
    )


def _detect_cycle_helper(node: str, dag: _DAG, seen: Set[str]) -> bool:
    if node in seen:
        return True

    seen.add(node)

    children = dag.get(node, [])
    for child in children:
        if _detect_cycle_helper(child, dag, seen):
            return True
    seen.remove(node)
    return False


def _detect_cycle(dag: _DAG) -> bool:
    seen = set()
    return any(_detect_cycle_helper(node, dag, seen) for node in dag.keys())


def get_default_variables():
    return {
        "today": datetime.today().strftime("%Y-%m-%d"),
        "yesterday": (datetime.today() - timedelta(1)).strftime("%Y-%m-%d"),
    }


def get_jinja_global_variables(jinja_env):
    """ Returns list of global variable keys from jinja environment

    Arguments:
        jinja_env {Any} -- jinja Environment

    Returns:
        List[str] List of global variable keys
    """
    return list(jinja_env.globals.keys())


def create_get_latest_partition(engine_id: int) -> Callable[[str, str], str]:
    metastore_loader = None
    with DBSession() as session:
        engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        metastore_id = engine.metastore_id if engine else None
        metastore_loader = (
            metastore.get_metastore_loader(metastore_id, session=session)
            if metastore_id is not None
            else None
        )
    if metastore_loader is None:
        raise LatestPartitionException(
            f"Unable to load metastore for engine id {engine_id}"
        )

    def get_latest_partition(
        full_table_name: str, partition: str = None, conditions: Dict[str, str] = None
    ) -> str:
        """Returns latest partition function of a given table and partition key

        Arguments:
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

        latest_partition = metastore_loader.get_latest_partition(
            schema_name, table_name, conditions
        )

        if latest_partition:
            partition_cols = latest_partition.split(
                "/"
            )  # latest_partition is like dt=2015-01-01/column1=val1

            if len(partition_cols) == 1:  # there is only one partition column
                partition_val = partition_cols[0].split("=")[1]
                return partition_val

            elif (
                not partition
            ):  # there is more than one partition column and partition key is not specified
                raise LatestPartitionException(
                    f"Table {full_table_name} has multiple partition columns. Please provide a parition key."
                )

            for partition_col in partition_cols:
                partition_key, partition_val = partition_col.split("=")

                if partition_key == partition:
                    return partition_val

        raise LatestPartitionException(
            f"Partitition '{partition}' not found on table '{full_table_name}'"
        )

    return get_latest_partition


def get_templated_query_env(engine_id: int):
    jinja_env = SandboxedEnvironment()
    jinja_env.globals.update(latest_partition=create_get_latest_partition(engine_id))
    return jinja_env


def get_templated_variables_in_string(s: str) -> Set[str]:
    """Find possible templated variables within a string

    Arguments:
        s {str}
    Returns:
        Set[str] - set of variable names
    """
    jinja_env = SandboxedEnvironment()

    ast = jinja_env.parse(s)
    variables = meta.find_undeclared_variables(ast)

    # temporarily applying https://github.com/pallets/jinja/pull/994/files
    # since the current version is binded by flask
    filtered_variables = set()
    for variable in variables:
        if variable not in jinja_env.globals:
            filtered_variables.add(variable)

    return filtered_variables


def verify_all_variables_are_defined(variables_required, variables_provided, jinja_env):
    jinja_global_variables = get_jinja_global_variables(jinja_env)
    for variable_name in variables_required:
        if (variable_name not in variables_provided) and (
            variable_name not in jinja_global_variables
        ):
            raise UndefinedVariableException(
                "Invalid variable name {}".format(variable_name)
            )


def render_query_with_variables(s, variables, jinja_env):
    template = jinja_env.from_string(s)

    return template.render(**variables)


def _flatten_variable(
    var_name: str,
    variable_defs: Dict[str, str],
    variables_dag: Dict[str, Set[str]],
    flattened_variables: Dict[str, str],
    jinja_env,
):
    """ Helper function for flatten_recursive_variables.
        Recursively resolve each variable definition
    """
    jinja_global_variables = get_jinja_global_variables(jinja_env)
    var_deps = variables_dag[var_name]
    filtered_var_deps = [var for var in var_deps if var not in jinja_global_variables]
    for dep_var_name in filtered_var_deps:
        # Resolve anything that is not defined
        if dep_var_name not in flattened_variables:
            _flatten_variable(
                dep_var_name,
                variable_defs,
                variables_dag,
                flattened_variables,
                jinja_env,
            )

    # Now all dependencies are solved
    jinja_env = jinja_env or SandboxedEnvironment(autoescape=False)
    template = jinja_env.from_string(variable_defs[var_name])
    flattened_variables[var_name] = template.render(
        **{
            dep_var_name: flattened_variables[dep_var_name]
            for dep_var_name in filtered_var_deps
        }
    )


def flatten_recursive_variables(
    raw_variables: Dict[str, str], jinja_env
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

    jinja_global_variables = get_jinja_global_variables(jinja_env)

    for key, value in raw_variables.items():
        if not value:
            value = ""

        variables_in_value = get_templated_variables_in_string(value)

        if len(variables_in_value) == 0:
            flattened_variables[key] = value
        else:
            for var_in_value in variables_in_value:
                # Double check if the recursive referred variable is valid
                if (var_in_value not in raw_variables) and (
                    var_in_value not in jinja_global_variables
                ):
                    raise UndefinedVariableException(
                        "Invalid variable name: {}.".format(var_in_value)
                    )
            variables_dag[key] = variables_in_value

    if _detect_cycle(variables_dag):
        raise QueryHasCycleException(
            "Infinite recursion in variable definition detected."
        )

    # Resolve everything within the dag
    for var_name in variables_dag:
        _flatten_variable(
            var_name, raw_variables, variables_dag, flattened_variables, jinja_env
        )
    return flattened_variables


def get_templated_query_variables(variables_provided, jinja_env):
    return flatten_recursive_variables(
        {**get_default_variables(), **variables_provided,}, jinja_env
    )


def render_templated_query(
    query: str, variables: Dict[str, str], engine_id: int
) -> str:
    """Renders the templated query, with global variables such as today/yesterday
       and functions such as `latest_partition`.
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
    jinja_env = get_templated_query_env(engine_id)
    try:
        escaped_query = _escape_sql_comments(query)
        variables_in_query = get_templated_variables_in_string(escaped_query)

        all_variables = get_templated_query_variables(variables, jinja_env)
        verify_all_variables_are_defined(variables_in_query, all_variables, jinja_env)

        return render_query_with_variables(escaped_query, all_variables, jinja_env)
    except TemplateSyntaxError as e:
        raise QueryJinjaSyntaxException(f"Line {e.lineno}: {e.message}")
