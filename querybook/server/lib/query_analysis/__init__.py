import sqlparse

skip_token_type = [
    sqlparse.tokens.Comment.Single,
    sqlparse.tokens.Comment.Multi,
    sqlparse.tokens.Whitespace,
    sqlparse.tokens.Newline,
]


def get_statement_ranges(query):
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


def get_statements(query):
    statement_ranges = get_statement_ranges(query)
    return [
        get_sanitized_statement(query[start:end]) for start, end in statement_ranges
    ]


def get_sanitized_statement(statement):
    return sqlparse.format(statement, strip_comments=True).strip(" \n\r\t;")
