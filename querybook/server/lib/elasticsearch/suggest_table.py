def construct_suggest_table_query(
    keyword: str,
    limit: int,
    metastore_id: int,
):
    return {
        "from": 0,
        "size": limit,
        "query": {
            "bool": {
                "must": [{"match_phrase_prefix": {"full_name": {"query": keyword}}}],
                "filter": {"match": {"metastore_id": metastore_id}},
            }
        },
        "_source": ["id", "full_name"],
    }
