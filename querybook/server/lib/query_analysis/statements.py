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
    line_lens = [len(line) for line in query.split("\n")]
    query_lines = [0]
    for line_len in line_lens:
        # The +1 is the newline character
        query_lines.append(query_lines[-1] + line_len + 1)
    return query_lines


def index_to_line_ch_pos(query_lines: List[int], index: int) -> Tuple[int, int]:
    """convert index to line,ch format

    Args:
        query_lines (List[int]): see get_query_lines()
        index (int): index of char in query

    Returns:
        Tuple[int, int]: line number, and char number. Is none if index out of range
    """
    for line, start_ch in enumerate(query_lines):
        # the second check is trivially true,
        # just in case query_lines is malformed
        if start_ch > index and line > 0:
            return line - 1, index - query_lines[line - 1]

    # Out of index - return something after the last line
    # Note: query_lines is at least length 2, so len(query_lines) - 2 is where
    # the last line is
    return len(query_lines) - 2, index - query_lines[-2]


def split_query_to_statements_with_start_location(query: str):
    statement_ranges = get_statement_ranges(query)
    statements = [query[start:end] for start, end in statement_ranges]

    query_lines = get_query_lines(query)
    statement_start_location = [
        index_to_line_ch_pos(query_lines, start) for start, _ in statement_ranges
    ]
    return statements, statement_start_location
