from datetime import datetime, timedelta
from typing import Dict, Set

from jinja2.sandbox import SandboxedEnvironment
from jinja2 import meta

_DAG = Dict[str, Set[str]]


class UndefinedVariableException(Exception):
    pass


class QueryHasCycleException(Exception):
    pass


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


def get_templated_variables_in_string(s: str) -> Set[str]:
    """Find possible templated variables within a string

    Arguments:
        s {str}
    Returns:
        Set[str] - set of variable names
    """
    env = SandboxedEnvironment()
    ast = env.parse(s)
    variables = meta.find_undeclared_variables(ast)

    # temporarily applying https://github.com/pallets/jinja/pull/994/files
    # since the current version is binded by flask
    filtered_variables = set()
    for variable in variables:
        if variable not in env.globals:
            filtered_variables.add(variable)

    return filtered_variables


def _flatten_variable(
    var_name: str,
    variable_defs: Dict[str, str],
    variables_dag: Dict[str, Set[str]],
    flattened_variables: Dict[str, str],
):
    """ Helper function for flatten_recursive_variables.
        Recurisvely resolve each variable definition
    """
    var_deps = variables_dag[var_name]
    for dep_var_name in var_deps:
        # Resolve anything that is not defined
        if dep_var_name not in flattened_variables:
            _flatten_variable(
                dep_var_name, variable_defs, variables_dag, flattened_variables,
            )

    # Now all dependencies are solved
    env = SandboxedEnvironment(autoescape=False)
    template = env.from_string(variable_defs[var_name])
    flattened_variables[var_name] = template.render(
        **{dep_var_name: flattened_variables[dep_var_name] for dep_var_name in var_deps}
    )


def flatten_recursive_variables(raw_variables: Dict[str, str]) -> Dict[str, str]:
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

        variables_in_value = get_templated_variables_in_string(value)

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

    if _detect_cycle(variables_dag):
        raise QueryHasCycleException(
            "Infinite recursion in variable definition detected."
        )

    # Resolve everything within the dag
    for var_name in variables_dag:
        _flatten_variable(var_name, raw_variables, variables_dag, flattened_variables)
    return flattened_variables


def render_templated_query(query: str, variables: Dict[str, str]) -> str:
    """Renders the templated query, with global variables such as today, yesterday.
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
    all_variables = flatten_recursive_variables(
        {**get_default_variables(), **variables,}
    )

    # Check if query contains any invalid variables
    variables_in_query = get_templated_variables_in_string(query)
    for variable_name in variables_in_query:
        if variable_name not in all_variables:
            raise UndefinedVariableException(
                "Invalid variable name {}".format(variable_name)
            )

    env = SandboxedEnvironment(autoescape=False)
    template = env.from_string(query)

    return template.render(**all_variables)
