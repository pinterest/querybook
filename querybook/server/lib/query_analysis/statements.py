from bisect import bisect_right
from typing import List, Tuple

import sqlparse

skip_token_type = [
    sqlparse.tokens.Comment.Single,
    sqlparse.tokens.Comment.Multi,
    sqlparse.tokens.Whitespace,
    sqlparse.tokens.Newline,
]


def get_statement_ranges(query: str) -> List[Tuple[int, int]]:
    statements = sqlparse.parse(query)
    statement_ranges = []
    start_index = 0

    for statement in statements:
        statement_str = statement.value
        statement_len = len(statement_str)

        if get_sanitized_statement(statement_str) != "":
            statement_start = start_index
            statement_end = start_index
            found_start = False

            for token in statement.flatten():
                token_type = getattr(token, "ttype")
                if not found_start:  # Skipping for start
                    if token_type in skip_token_type:
                        statement_start += len(token.value)
                    else:
                        found_start = True
                        statement_end = statement_start
                # Don't change this to else:, since token from not found start
                # might be used here
                if found_start:  # Looking for end ;
                    if token_type != sqlparse.tokens.Punctuation or token.value != ";":
                        statement_end += len(token.value)
                    else:
                        break

            statement_range = (statement_start, statement_end)
            statement_ranges.append(statement_range)
        start_index += statement_len

    return statement_ranges


def get_statements(query: str):
    statement_ranges = get_statement_ranges(query)
    return [
        get_sanitized_statement(query[start:end]) for start, end in statement_ranges
    ]


def get_sanitized_statement(statement: str):
    return sqlparse.format(statement, strip_comments=True).strip(" \n\r\t;")


def get_query_lines(query: str) -> List[int]:
    query_lines = (
        [0] + [i + 1 for i, c in enumerate(query) if c == "\n"] + [len(query) + 1]
    )
    return query_lines


def index_to_line_ch_pos(query_lines: List[int], ch_idx: int) -> Tuple[int, int]:
    """convert index to line,ch format

    Args:
        query_lines (List[int]): see get_query_lines()
        ch_idx (int): index of char in query

    Returns:
        Tuple[int, int]: line number, and char number. Is none if index out of range
    """
    idx = bisect_right(query_lines, ch_idx) - 1
    return idx, ch_idx - query_lines[idx]


def split_query_to_statements_with_start_location(
    query: str,
) -> Tuple[List[str], List[Tuple[int, int]]]:
    """This function would split the query into list of statements,
       and for each statement, return their start location as (line, ch) Tuple

    Args:
        query (str): the SQL query being passed in

    Returns:
        Tuple[List[str], List[Tuple[int, int]]]: First value is list of statements,
            second is list of starting location
    """
    statement_ranges = get_statement_ranges(query)
    statements = [query[start:end] for start, end in statement_ranges]

    query_lines = get_query_lines(query)
    statement_start_location = [
        index_to_line_ch_pos(query_lines, start) for start, _ in statement_ranges
    ]
    return statements, statement_start_location
