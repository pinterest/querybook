from typing import List
from lib.logger import get_logger
import sqlparse


ignore_types = set(["WHITESPACE", "NEWLINE", "ERROR", "SINGLE"])

table_keywords = set(["TABLE", "FROM", "JOIN", "INTO"])

initial_statement_keywords = set(["DESCRIBE", "DESC", "SHOW", "MSCK"])

continue_table_search_key_word = set(
    [
        "IF",
        "NOT",
        "EXISTS",
        "FORMATTED",
        "REPAIR",
        "PARTITIONS",
        "EXTENDED",
    ]
)

LOG = get_logger(__file__)


def process_query(query, language=None):
    """
    This function does all the necessary processing to find the lineage.
    Returns:
        (Lineage, Statments) where
        Lineage: [{table: [lineage]}],
        Statements: [{table: 'statement' }]
    """
    if language == "sqlite":
        default_schema = "main"
    else:
        default_schema = "default"

    lineage_per_statement = []
    table_per_statement = []
    # This tracks which schema (generic parent table specified in a USE statement) is in use
    statements = tokenize_by_statement(query)
    # A list of placeholders but are not real tables

    for statement in statements:
        default_schema = get_statement_schema(statement, default_schema)
        placeholder_tables = get_statement_placeholders(statement)
        table_list, from_list = get_table_list(
            statement, placeholder_tables, default_schema
        )
        table_per_statement.append(list(set(table_list + from_list)))
        lineage_per_statement.append(compute_lineage(table_list, from_list))
    return table_per_statement, lineage_per_statement


def get_table_statement_type(query: str) -> List[str]:
    """Get the statement type for each statement in the query
       that are RELEVANT to a TABLE

    Arguments:
        query {str} -- The SQL query

    Returns:
        List[str] -- List of statement types, For DDL/DML return:
                        SELECT/UPDATE/CREATE/DROP
                     Return None if not identifiable.
    """

    statements = tokenize_by_statement(query)
    statement_types = []
    for statement in statements:
        statement_type = None

        # Find the first Keyword that is not a WITH
        index, token = statement.token_next(-1)
        while token and (not token.is_keyword or token.value == "WITH"):
            index, token = statement.token_next(index)

        if token is not None and hasattr(token, "ttype"):
            if token.value in ("SELECT", "INSERT"):
                statement_type = token.value
            elif (
                token.ttype == sqlparse.tokens.Keyword.DML
                or token.ttype == sqlparse.tokens.Keyword.DDL
            ):
                # need to check if DML/DDL is related to a table
                # for example DROP TABLE, CREATE TABLE etc
                table_token = token
                while (
                    table_token and table_token.is_keyword
                ):  # Go through next few keywords
                    index, table_token = statement.token_next(index)
                    if str(table_token) == "TABLE":
                        # Found table, so the statement is indeed about table
                        statement_type = token.value
                        break
        statement_types.append(statement_type)
    return statement_types


def get_statement_placeholders(statement):
    """
    This function checks for table names that act as placeholders
    Returns:
        A list of names used as placeholders for actual tables
    """
    placeholders = []
    if statement.token_first(skip_cm=True).value != "WITH":
        return placeholders
    index, token = statement.token_next(0)
    while token is not None:
        if isinstance(token, sqlparse.sql.Identifier):
            placeholders.append(token.get_real_name())
        elif token and isinstance(token, sqlparse.sql.IdentifierList):
            for identifier in token.get_identifiers():
                if isinstance(identifier, sqlparse.sql.Identifier):
                    placeholders.append(identifier.get_real_name())
        elif hasattr(token, "ttype") and token.ttype == sqlparse.tokens.Keyword.DML:
            break
        index, token = statement.token_next(index)
    return placeholders


def should_ignore_token(token) -> bool:
    """
    Check types of tokens (HIVE commands) to filter out irrelevant commands.
    Returns:
        Boolean depennding on whether the token type is denylisted
    """
    return token.ttype in [
        sqlparse.tokens.Whitespace,
        sqlparse.tokens.Newline,
        sqlparse.tokens.Error,
        sqlparse.tokens.Other,
    ]


def get_statement_schema(statement, current_schema) -> str:
    """
    If it is a "USE" statement, return the new schema
    otherwise current schema is returned
    Returns:
        schema: string
    """

    if statement.token_first().value == "USE":
        _, second_token = statement.token_next(0)
        if second_token and isinstance(second_token, sqlparse.sql.Identifier):
            return second_token.value
    return current_schema


def sanitize_table_name(name, default_schema):
    if "." in name:
        return name
    return f"{default_schema}.{name}"


def get_full_table_name(statement, index):
    full_name = ""
    while index < len(statement):
        token = statement[index]
        if token.ttype == sqlparse.tokens.Name or token.value == ".":
            full_name += token.value
        else:
            break

        index += 1
    return full_name


def get_table_list(statement, placeholders, default_schema):
    """
    Finds the actual lineage of a table in a query.
    Returns:
        (table_list, from_list) where
        table_list is a list of tables inserted to in the query,
        from_list is a list of tables data is from
    """
    table_list, from_list = [], []
    table_search_keyword = None
    table_search_mode = False

    flattened_statement = list(statement.flatten())
    first_token = statement.token_first(skip_cm=True)
    for index, token in enumerate(flattened_statement):
        if should_ignore_token(token):
            continue

        signifier = token.value.split(" ")[-1]
        if token.ttype == sqlparse.tokens.Keyword:
            if signifier in table_keywords:
                table_search_keyword = token.value
                table_search_mode = True
            elif token is first_token and signifier in initial_statement_keywords:
                table_search_mode = True
            elif signifier not in continue_table_search_key_word:
                table_search_mode = False
        elif token.ttype == sqlparse.tokens.Punctuation:
            table_search_mode = False
        elif token.ttype == sqlparse.tokens.Name:
            if table_search_mode:
                table_name = get_full_table_name(flattened_statement, index)
                if table_name not in placeholders:
                    if table_search_keyword in ["TABLE", "INTO"]:
                        table_list.append(
                            sanitize_table_name(table_name, default_schema)
                        )
                    else:
                        from_list.append(
                            sanitize_table_name(table_name, default_schema)
                        )
            table_search_mode = None
    return table_list, from_list


def compute_lineage(table_list, from_list):
    if len(table_list) == 0 or len(table_list) == 0:
        return []

    lineage = []
    for source in from_list:
        for target in table_list:
            lineage.append({"source": source, "target": target})
    return lineage


def tokenize_by_statement(query: str):
    statements = sqlparse.parse(
        sqlparse.format(query.strip(), strip_comments=True, keyword_case="upper")
    )

    # Filter out empty statements
    return [
        statement for statement in statements if statement.token_first() is not None
    ]
