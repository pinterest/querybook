from typing import Tuple


def get_query_coordinate_by_index(query: str, index: int) -> Tuple[int, int]:
    rows = query[: index + 1].splitlines(keepends=False)
    return len(rows) - 1, len(rows[-1]) - 1


def get_query_index_by_coordinate(query: str, start_line: int, start_ch: int) -> int:
    rows = query.splitlines(keepends=True)[:start_line]
    return sum([len(row) for row in rows]) + start_ch
