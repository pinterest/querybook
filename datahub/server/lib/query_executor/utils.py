import json

import datetime
from lib.utils.utils import DATE_STRING, DATETIME_STRING
from const.query_execution import QueryExecutionErrorType

should_escape_list = (",", '"', "\n", "\r")


def spread_dict(x, y):
    z = x.copy()
    z.update(y)
    return z


def merge_str(str1: str, str2: str, separator: str = "\n") -> str:
    """Join two strings together if by the separator. If either is empty
       then separator will not be used

    Arguments:
        str1 {str} -- Joined on left
        str2 {str} -- Joined on right

    Keyword Arguments:
        separator {str} -- Middle string if both input are non-empty
                           (default: {'\n'})

    Returns:
        str -- The joined str
    """
    if len(str1) and len(str2):
        return str1 + separator + str2
    return str1 or str2


def serialize_cell(cell) -> str:
    try:
        cell_type = type(cell)
        if cell_type == str:
            return cell
        elif cell_type == datetime.datetime:
            return DATETIME_STRING(cell)
        elif cell_type == datetime.date:
            return DATE_STRING(cell)
        else:
            return json.dumps(cell, ensure_ascii=False)
    except (UnicodeDecodeError, TypeError):
        # obj is byte string
        try:
            return str(cell)
        except Exception:
            return "[Unserializable]"


def row_to_csv(row):
    output = []
    for cell in row:
        str_col = serialize_cell(cell)

        if any(c in str_col for c in should_escape_list):
            str_col = '"%s"' % str_col.replace('"', '""')

        output.append(str_col)
    return ",".join(output) + "\n"


def parse_exception(e):
    error_type = QueryExecutionErrorType.INTERNAL.value
    error_str = str(e)
    error_extracted = None

    return error_type, error_str, error_extracted


def get_parsed_syntax_error(
    message: str, line_num: int = None, char_num: int = None,
):
    error_type = QueryExecutionErrorType.SYNTAX.value
    error_str = json.dumps({"line": line_num, "char": char_num, "message": message,})
    return error_type, error_str, None
