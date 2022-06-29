import re
from enum import Enum
import json
from typing import Dict, Tuple, List, Union

from app.db import with_session
from logic.metastore import get_table_by_id


class QuerybookColumnType(Enum):
    String = "string"
    Number = "number"
    Boolean = "boolean"

    # For composite types
    Composite = "composite"
    Unknown = "unknown"


class SamplesError(Exception):
    pass


@with_session
def make_samples_query(
    table_id,
    limit,
    partition=None,
    where: List[Tuple[str, str, str]] = None,
    order_by=None,
    order_by_asc=True,
    session=None,
):
    table = get_table_by_id(table_id, session=session)
    column_type_by_name = {
        column.name: get_column_type_from_string(column.type)
        for column in table.columns
    }
    query_filters = []

    partition = _verify_or_get_partition(table, partition)
    if partition:
        query_filters.extend(_format_partition_filter(partition, column_type_by_name))

    if where is not None:
        for where_filter in where:
            query_filters.append(
                _format_where_clause_filter(where_filter, column_type_by_name)
            )

    query_filter_str = (
        "WHERE\n{}".format(" AND ".join(query_filters)) if len(query_filters) else ""
    )

    order_by_str = ""
    if order_by is not None:
        if order_by not in column_type_by_name:
            raise SamplesError("Invalid order by " + order_by)
        order_by_str = "ORDER BY {} {}".format(
            order_by, "ASC" if order_by_asc else "DESC"
        )

    full_name = "{}.{}".format(table.data_schema.name, table.name)
    query = """
SELECT
    *
FROM {}
{}
{}
LIMIT {}""".format(
        full_name, query_filter_str, order_by_str, limit
    )

    return query


def _verify_or_get_partition(table, partition: Union[str, None]) -> Union[str, None]:
    """
    Get the list of latest partitions from table
    If partition is provided, then we check if it is in latest partitions
    Else if partition is None, then we set it from the latest partitions

    Args:
        table (DataTable): Table from DB
        partition (Union[str, None]): Partition for table, can be None

    Returns:
        Union[str, None]: Valid partition or None if none available
    """

    information = table.information
    partitions = []
    if information:
        partitions = json.loads(information.to_dict().get("latest_partitions") or "[]")

    if partition is None:
        partition = next(iter(reversed(partitions)), None)
    else:
        # Since partition is provided
        # Check the validity of partition provided
        if not (len(partitions) and partition in partitions):
            raise SamplesError("Invalid partition " + partition)

    return partition


def _format_partition_filter(
    partition: str, column_type_by_name: Dict[str, QuerybookColumnType]
) -> List[str]:
    """From a partition like dt=2015-01-01/column1=val1
       Create where clauses like ["dt = '2015-01-01'", "column1 = 'val1'"]

    Args:
        partition (str): Partition in HMS format
        column_type_by_name (Dict[str, QuerybookColumnType]): Column name to type

    Returns:
        List[str]: List of where clauses
    """

    partition_filters = []
    for column_filter in partition.split("/"):
        column_name, column_val = column_filter.split("=")
        column_type = column_type_by_name.get(column_name, None)
        column_quote = ""
        if column_type == QuerybookColumnType.String:
            column_quote = "'"

        partition_filters.append(
            f"{column_name}={column_quote}{column_val}{column_quote}"
        )
    return partition_filters


def _format_where_clause_filter(
    where_filter: Tuple[str, str, str],
    column_type_by_name: Dict[str, QuerybookColumnType],
) -> str:
    """Given a where filter, convert it to SQL

    Args:
        where_filter (Tuple[str, str, str]): Tuple of column name, operator, and value
        column_type_by_name (Dict[str, QuerybookColumnType]): column name to type

    Returns:
        str: SQL clause in where
    """
    column_name, filter_op, filter_val = where_filter
    if column_name not in column_type_by_name:
        raise SamplesError(f"Invalid filter column {column_name}")
    column_type = column_type_by_name[column_name]

    if filter_op not in COMPARSION_OP:
        raise SamplesError(f"Invalid filter op {filter_op} for column {column_name}")

    if filter_op in COMPARSION_OP_WITH_VALUE:
        if column_type == QuerybookColumnType.Number:
            if not filter_val or not filter_val.replace(".", "", 1).isdigit():
                raise SamplesError(
                    f"Invalid numeric filter value '{filter_val}' for column {column_name}"
                )
        elif column_type == QuerybookColumnType.Boolean:
            if filter_val != "true" and filter_val != "false":
                raise SamplesError(
                    f"Invalid boolean filter value '{filter_val}' for column {column_name}"
                )
        else:  # column_type == QuerybookColumnType.String
            filter_val = "'{}'".format(json.dumps(filter_val)[1:-1])
    else:
        filter_val = ""

    return f"{column_name} {filter_op} {filter_val}".strip()


COMPARSION_OP_WITH_VALUE = [
    "=",
    "!=",
    ">",
    ">=",
    "<",
    "<=",
    "LIKE",
]
COMPARSION_OP = COMPARSION_OP_WITH_VALUE + [
    "IS NULL",
    "IS NOT NULL",
]


common_sql_types = {
    "boolean": QuerybookColumnType.Boolean,
    # Integers
    "int": QuerybookColumnType.Number,
    "integer": QuerybookColumnType.Number,
    "tinyint": QuerybookColumnType.Number,
    "smallint": QuerybookColumnType.Number,
    "mediumint": QuerybookColumnType.Number,
    "bigint": QuerybookColumnType.Number,
    # Floats
    "real": QuerybookColumnType.Number,
    "numeric": QuerybookColumnType.Number,
    "decimal": QuerybookColumnType.Number,
    "float": QuerybookColumnType.Number,
    "double": QuerybookColumnType.Number,
    # Time
    "date": QuerybookColumnType.String,
    "datetime": QuerybookColumnType.String,
    "time": QuerybookColumnType.String,
    "timestamp": QuerybookColumnType.String,
    "interval": QuerybookColumnType.String,
    # String
    "string": QuerybookColumnType.String,
    "char": QuerybookColumnType.String,
    "varchar": QuerybookColumnType.String,
    "text": QuerybookColumnType.String,
    "tinytext": QuerybookColumnType.String,
    "mediumtext": QuerybookColumnType.String,
    "longtext": QuerybookColumnType.String,
    "blob": QuerybookColumnType.String,
    "longblob": QuerybookColumnType.String,
    "varbinary": QuerybookColumnType.String,
    "json": QuerybookColumnType.Composite,
    "array": QuerybookColumnType.Composite,
    "map": QuerybookColumnType.Composite,
    "row": QuerybookColumnType.Composite,
    "uniontype": QuerybookColumnType.Composite,
    "struct": QuerybookColumnType.Composite,
}


def get_column_type_from_string(raw_column: str) -> QuerybookColumnType:
    """Converts column type from different language into a
       more understandable format

    Arguments:
        raw_column {str} -- The column type string, can be any column type defined in
        presto, hive, mysql, etc...

    Returns:
        QuerybookColumnType -- Column type that's understood by Querybook
    """

    # Extract the start of the raw_column
    match = re.match(r"^([a-zA-Z]+)", raw_column)
    first_word = match.group(1).lower() if match is not None else ""

    column_type = (
        common_sql_types[first_word]
        if first_word in common_sql_types
        else QuerybookColumnType.Unknown
    )
    return column_type
