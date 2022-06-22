from lib.elasticsearch.query_utils import (
    match_any_field,
    match_filters,
    highlight_fields,
    order_by_fields,
)


def _data_doc_access_terms(user_id):
    return [
        {"term": {"owner_uid": user_id}},
        {"term": {"readable_user_ids": user_id}},
        {"term": {"public": True}},
    ]


def _match_data_doc_fields(fields):
    search_fields = []
    for field in fields:
        # 'title', 'cells', and 'owner' are fields used by Data Doc search
        if field == "title":
            search_fields.append("title^5")
        elif field == "cells":
            search_fields.append("cells")
        elif field == "owner":
            search_fields.append("owner")

    return search_fields


def construct_datadoc_query(
    uid,
    keywords,
    filters,
    fields,
    limit,
    offset,
    sort_key=None,
    sort_order=None,
):
    # TODO: fields is not used because explicit search for Data Docs is not implemented
    search_query = match_any_field(
        keywords,
        search_fields=_match_data_doc_fields(fields),
    )
    search_filter = match_filters(filters)
    if search_filter == {}:
        search_filter["filter"] = {"bool": {}}
    search_filter["filter"]["bool"].setdefault("must", []).append(
        {"bool": {"should": _data_doc_access_terms(uid)}}
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
        "_source": ["id", "title", "owner_uid", "created_at"],
        "size": limit,
        "from": offset,
    }

    query.update(order_by_fields(sort_key, sort_order))

    query.update(
        highlight_fields(
            {
                "cells": {
                    "fragment_size": 60,
                    "number_of_fragments": 3,
                }
            }
        )
    )

    return query
