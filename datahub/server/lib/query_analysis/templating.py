from datetime import datetime, timedelta
from typing import Dict, List, Set, Tuple

import pystache
from pystache.parser import _EscapeNode, _PartialNode, _SectionNode, _InvertedNode


_DAG = Dict[str, Set[str]]


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


def extract_variables_from_tokens(tokens: List) -> Set[str]:
    variables = set()
    for item in tokens:
        if isinstance(item, str):
            continue
        elif isinstance(item, (_EscapeNode, _PartialNode)):
            if item.key != ".":  # '.' is this/self context
                variables.add(item.key)
        elif isinstance(item, _SectionNode):
            variables.add(item.key)
            variables = variables.union(
                extract_variables_from_tokens(item.parsed._parse_tree)
            )
        elif isinstance(item, _InvertedNode):
            variables.add(item.key)
            variables = variables.union(
                extract_variables_from_tokens(item.parsed_section._parse_tree)
            )
    return variables


def get_templated_variables_in_string(s: str):
    """Find possible templated variables within a string

    Arguments:
        s {str}
    """
    return extract_variables_from_tokens(pystache.parse(s)._parse_tree)


def separate_variable_and_partials(
    raw_variables: Dict[str, str]
) -> Tuple[Dict[str, str], Dict[str, str]]:
    """Given pairs of variable name and variable values, separate them
       into normal variables which are simple name->value pairs and partials
       which can refer other variables

    Arguments:
        raw_variables {Dict[str, str]} -- The variable name/value pair

    Raises:
        Exception: If the partials contains a cycle, an exception will be raised

    Returns:
        Tuple[Dict[str, str], Dict[str, str]] -- the normal variables, and the partials
    """
    variables = {}
    partials = {}
    partials_dag = {}

    for key, value in raw_variables.items():
        if not value:
            value = ""

        variables_in_value = get_templated_variables_in_string(value)
        if len(variables_in_value) == 0:
            variables[key] = value
        else:
            partials[key] = value
            partials_dag[key] = variables_in_value

    if _detect_cycle(partials_dag):
        raise Exception("Infinite recursion in variable definition detected.")

    return variables, partials


def render_templated_query(query: str, raw_variables: Dict[str, str]) -> str:
    """Renders the templated query, with global variables such as today, yesterday.
       All the default html escape is ignore since it is not applicable.
       It also checks if a variable is a partial (in which it can refer other variables).


    Arguments:
        query {str} -- The query string that would get rendered
        raw_variables {Dict[str, str]} -- The variable name, variable value string pair

    Raises:
        Exception: Raised when variable in query is not defined or if the variable defintion
                   contains a cycle which would cause infinite recursion

    Returns:
        str -- The rendered string
    """
    variables, partials = separate_variable_and_partials(raw_variables)
    all_variables = {**get_default_variables(), **variables}

    # Check if query contains any invalid variables
    variables_in_query = get_templated_variables_in_string(query)
    for variable_name in variables_in_query:
        if variable_name not in all_variables and variable_name not in partials:
            raise Exception("Invalid variable name {}".format(variable_name))

    renderer = pystache.Renderer(
        # Simple escape to get rid of html escaping
        escape=lambda u: u,
        partials=partials,
    )
    return renderer.render(query, all_variables)
