def construct_suggest_table_query(
    prefix: str,
    limit: int,
    metastore_id: int,
):
    return {
        "suggest": {
            "suggest": {
                "text": prefix,
                "completion": {
                    "field": "completion_name",
                    "size": limit,
                    "contexts": {"metastore_id": metastore_id},
                },
            }
        },
    }
