import json
from app.db import with_session
from logic.metastore import get_table_by_id


@with_session
def make_samples_query(table_id, limit, session=None):
    table = get_table_by_id(table_id, session=session)
    information = table.information

    partitions = []
    if information:
        partitions = json.loads(information.to_dict().get("latest_partitions") or "[]")
    latest_partition = next(iter(reversed(partitions)), None)

    full_name = "%s.%s" % (table.data_schema.name, table.name)

    query_filter = ""
    if latest_partition:  # latest_partitions is like dt=2015-01-01/column1=val1
        partition_columns = []
        for column_filter in latest_partition.split("/"):
            column_name, column_val = column_filter.split("=")

            column_quote = ""
            if not column_val.replace(".", "", 1).isdigit():
                column_quote = "'"

            partition_columns.append(
                f"{column_name}={column_quote}{column_val}{column_quote}"
            )
        filters = " AND ".join(partition_columns)
        query_filter = "WHERE\n{}".format(filters)

    query = """
select
    *
from {}
{}
limit {}""".format(
        full_name, query_filter, limit
    )

    return query
