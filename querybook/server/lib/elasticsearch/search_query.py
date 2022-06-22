from lib.elasticsearch.query_utils import (
    match_filters,
    highlight_fields,
    order_by_fields,
)

FILTERS_TO_AND = ["full_table_name"]


def _query_access_terms(user_id):
    return [
        {"term": {"author_uid": user_id}},
        {"term": {"readable_user_ids": user_id}},
        {"term": {"public": True}},
    ]


def construct_query_search_query(
    uid,
    keywords,
    filters,
    limit,
    offset,
    sort_key=None,
    sort_order=None,
):
    search_query = {}
    if keywords:
        search_query = {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": keywords,
                        "fields": ["query_text", "title"],
                        # All words must appear in a field
                        "operator": "and",
                    },
                },
                "should": [
                    {
                        "match_phrase": {
                            "query_text": {
                                "query": keywords,
                                "boost": 10,
                            }
                        }
                    },
                    {
                        "match_phrase": {
                            "title": {
                                "query": keywords,
                            }
                        }
                    },
                ],
            }
        }
    else:
        search_query = {"match_all": {}}

    search_filter = match_filters(filters, and_filter_names=FILTERS_TO_AND)
    if search_filter == {}:
        search_filter["filter"] = {"bool": {}}
    search_filter["filter"]["bool"].setdefault("must", []).append(
        {"bool": {"should": _query_access_terms(uid)}}
    )

    bool_query = {}
    if search_query != {}:
        bool_query["must"] = [search_query]
    if search_filter != {}:
        bool_query["filter"] = search_filter["filter"]
        if "range" in search_filter:
            bool_query.setdefault("must", [])
            bool_query["must"] += search_filter["range"]

    query = {
        "query": {"bool": bool_query},
        "size": limit,
        "from": offset,
    }

    query.update(order_by_fields(sort_key, sort_order))
    query.update(
        highlight_fields(
            {
                "query_text": {
                    "fragment_size": 150,
                    "number_of_fragments": 3,
                },
                "title": {
                    "fragment_size": 20,
                    "number_of_fragments": 3,
                },
            }
        )
    )

    return query
