from typing import List, Optional, Union
from sqlglot import exp, parse, parse_one, transpile, errors

from lib.logger import get_logger
from const.sqlglot import QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING

LOG = get_logger(__file__)


def _get_sqlglot_dialect(language: Optional[str] = None):
    return QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING.get(language, None)


def _statements_to_query(statements: List[str]):
    return "\n".join(statement + ";" for statement in statements)


def format_query(query: str, language: Optional[str] = None):
    dialect = _get_sqlglot_dialect(language)
    statements = transpile(
        query,
        read=dialect,
        write=dialect,
        pretty=True,
    )

    return _statements_to_query(statements)


def get_select_statement_limit(
    statement: Union[exp.Expression, str],
    language: Optional[str] = None,
) -> Union[int, None]:
    """Get the limit of a select/union statement.
    Args:
        statement_ast: The select statement ast
    Returns:
        int: The limit of the select statement. -1 if no limit, or None if not a select/union statement
    """
    if isinstance(statement, str):
        statement = parse_one(statement, dialect=_get_sqlglot_dialect(language))

    if not isinstance(
        statement, (exp.Select, exp.Union)
    ):  # not a select or union statement
        return None

    limit = -1
    limit_clause = statement.args.get("limit")

    if isinstance(limit_clause, exp.Limit):
        limit = limit_clause.expression.this
    elif isinstance(limit_clause, exp.Fetch):
        limit = limit_clause.args.get("count").this

    return int(limit)


def get_limited_select_statement(statement_ast: exp.Expression, limit: int):
    """Apply a limit to a select/union statement if it doesn't already have a limit.
    It returns a new statement with the limit applied and the original statement is not modified.
    """
    current_limit = get_select_statement_limit(statement_ast)
    if current_limit is None or current_limit >= 0:
        return statement_ast

    return statement_ast.limit(limit)


def has_query_contains_unlimited_select(query: str, language: str) -> bool:
    """Check if a query contains a select statement without a limit.
    Args:
        query: The query to check
    Returns:
        bool: True if the query contains a select statement without a limit, False otherwise
    """
    statements = parse(query, dialect=_get_sqlglot_dialect[language])
    return any(get_select_statement_limit(s) == -1 for s in statements)


def transform_to_limited_query(
    query: str, limit: int = None, language: str = None
) -> str:
    """Apply a limit to all select statements in a query if they don't already have a limit.
    It returns a new query with the limit applied and the original query is not modified.
    """
    if not limit:
        return query

    try:
        dialect = _get_sqlglot_dialect(language)
        statements = parse(query, dialect=dialect)

        updated_statements = [
            get_limited_select_statement(s, limit) for s in statements
        ]
        return _statements_to_query(
            [s.sql(dialect=dialect, pretty=True) for s in updated_statements]
        )
    except errors.ParseError as e:
        LOG.error(e, exc_info=True)
        # If parsing fails, return the original query
        return query


def _get_sampled_statement(
    statement_ast: exp.Expression,
    sampling_tables: dict[str, dict[str, str]],
):
    """Apply sampling to a sglglot statement AST for the given tables."""

    def transformer(node):
        if isinstance(node, exp.Table):
            full_table_name = f"{node.db}.{node.name}" if node.db else node.name
            if full_table_name not in sampling_tables:
                return node

            if (
                sampled_table := sampling_tables[full_table_name].get("sampled_table")
            ) is not None:
                node.set("this", exp.to_identifier(sampled_table, quoted=False))
                node.set("db", None)
            elif (
                sample_rate := sampling_tables[full_table_name].get("sample_rate")
            ) is not None:
                return exp.TableSample(
                    this=node, method="SYSTEM", percent=str(sample_rate)
                )
        return node

    return statement_ast.transform(transformer)


def transform_to_sampled_query(
    query: str,
    language: str = None,
    sampling_tables: dict[str, dict[str, str]] = {},
):
    """Apply sampling to the query for the given tables.

    An example of sampling_tables:
    {
        "db.table1": {"sampled_table": "db.sampled_table1"},
        "db.table2": {"sample_rate": 0.1},
    }

    If sampled_table is provided, the table will be replaced with the sampled_table over using the sample_rate.

    Args:
        query: The query to apply sampling to
        language: The language of the query
        sampling_tables: A dictionary of tables to sample and their sampled version or sample rates
    Returns:
        str: The sampled query
    """
    try:
        dialect = _get_sqlglot_dialect(language)
        statements = parse(query, dialect=dialect)
        sampled_statements = [
            _get_sampled_statement(s, sampling_tables) for s in statements
        ]
        return _statements_to_query(
            [s.sql(dialect=dialect, pretty=True) for s in sampled_statements]
        )

    except errors.ParseError as e:
        LOG.error(e, exc_info=True)
        # If parsing fails, return the original query
        return query
