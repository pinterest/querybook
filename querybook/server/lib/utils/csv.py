import csv
import datetime
from io import StringIO
import json
import sys
from typing import Generator, List, Tuple

from .utils import DATE_STRING, DATETIME_STRING

LINE_TERMINATOR = "\n"
COLUMN_TERMINATOR = ","
COLUMN_ESCAPE = '"'


# HACK: https://stackoverflow.com/questions/15063936/csv-error-field-larger-than-field-limit-131072
csv.field_size_limit(sys.maxsize)


def str_to_csv_iter(raw_csv_str: str) -> Generator[List[List[str]], None, None]:
    # Remove NULL byte to make sure csv conversion works
    raw_csv_str = raw_csv_str.replace("\x00", "")
    raw_results = StringIO(raw_csv_str)
    return csv.reader(raw_results, delimiter=",")


def string_to_csv(raw_csv_str: str) -> List[List[str]]:
    csv_reader = str_to_csv_iter(raw_csv_str)
    return [row for row in csv_reader]


should_escape_list = (",", '"', "\n", "\r")


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


def csv_sniffer(lines: List[str]) -> int:
    """Given n number of lines, figure out
       the last valid line for a csv. The CSV
       is comma separated and quoted with ".

    Args:
        lines (List[str]): Strings

    Returns:
        int: The last valid index for CSV line (inclusive).
             lines[:return_val + 1] is a valid CSV block.
    """
    last_valid_index = None

    is_inside_cell = False  # Is inside a CSV cell, ie cursor | is in "|cell\n"
    max_columns_count = None  # All rows should be at least this many
    columns_count = 0  # The expected number of columns

    for line_idx, line in enumerate(lines):
        line_len = len(line)

        char_idx = 0
        while char_idx < line_len:
            char = line[char_idx]

            if char == COLUMN_ESCAPE:
                if is_inside_cell:
                    next_char = line[char_idx + 1] if char_idx < line_len - 1 else None
                    if next_char == COLUMN_ESCAPE:
                        # We are seeing "", which is a escaped version of "
                        char_idx += 2
                        continue
                    else:
                        is_inside_cell = False
                else:
                    is_inside_cell = True
            elif not is_inside_cell and char == COLUMN_TERMINATOR:
                columns_count += 1
            char_idx += 1

        # Done looping over the entire line
        if not is_inside_cell:  # In this case, it is a valid line
            if max_columns_count is None:
                max_columns_count = columns_count

            if columns_count > max_columns_count:
                raise ValueError(
                    f"CSV is not valid, expected {max_columns_count + 1} cols but seen {columns_count + 1} cols"
                )

            columns_count = 0
            last_valid_index = line_idx

    return last_valid_index


def split_csv_to_chunks(lines: List[str]) -> Tuple[List[str], List[str]]:
    """Given a list of lines, break them into 2 parts
       The first part is a valid CSV chunk, the second part
       is partial CSV chunk

    Args:
        lines (List[str]): List of lines that do not have \n in them

    Returns:
        Tuple[List[str], List[str]]: [Valid CSV, Partial block]
    """

    last_valid_csv_idx = csv_sniffer(lines)

    if last_valid_csv_idx is None:
        return [], lines

    valid_csv_chunk = lines[: last_valid_csv_idx + 1]
    partial_csv_lines = lines[last_valid_csv_idx + 1 :]
    return valid_csv_chunk, partial_csv_lines
