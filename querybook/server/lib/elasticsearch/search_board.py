from lib.elasticsearch.query_utils import (
    match_any_field,
    match_filters,
    highlight_fields,
    order_by_fields,
    combine_keyword_and_filter_query,
)


def _match_board_fields(fields):
    search_fields = []
    for field in fields:
        if field == "title":
            search_fields.append("title^5")
        elif field == "description":
            search_fields.append("description")
        elif field == "full_table_name":
            search_fields.append("full_table_name")
        elif field == "doc_name":
            search_fields.append("doc_name")

    return search_fields


def _board_access_terms(uid: int):
    return [
        {"term": {"readable_user_ids": uid}},
        {"term": {"public": True}},
    ]


def construct_board_query(
    uid,
    keywords,
    filters,
    fields,
    limit,
    offset,
    sort_key=None,
    sort_order=None,
):
    keywords_query = match_any_field(
        keywords,
        search_fields=_match_board_fields(fields),
    )

    search_filter = match_filters(filters)
    search_filter.setdefault("filter", {}).setdefault("bool", {}).setdefault(
        "must", []
    ).append({"bool": {"should": _board_access_terms(uid)}})

    query = {
        "query": {
            "bool": combine_keyword_and_filter_query(keywords_query, search_filter)
        },
        "_source": ["id", "title", "owner_uid", "description"],
        "size": limit,
        "from": offset,
    }

    query.update(order_by_fields(sort_key, sort_order))

    query.update(
        highlight_fields(
            {
                "description": {
                    "fragment_size": 60,
                    "number_of_fragments": 3,
                },
            }
        )
    )
    return query
