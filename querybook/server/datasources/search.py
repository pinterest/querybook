import json
from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_metastore_permission,
)
from app.datasource import register, api_assert
from lib.logger import get_logger
from logic.elasticsearch import ES_CONFIG, get_hosted_es
from logic import metastore as logic


LOG = get_logger(__file__)


def _highlight_fields(fields_to_highlight):
    return {
        "highlight": {
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"],
            "type": "plain",
            "fields": fields_to_highlight,
        }
    }


def _match_any_field(keywords="", search_fields=[]):
    if keywords == "":
        return {}
    query = {
        "multi_match": {
            "query": keywords,
            "fields": search_fields,
            "type": "cross_fields",
            "minimum_should_match": "100%",
        }
    }
    return query


def _make_singular_filter(filter_name: str, filter_val):
    """Create a elasticsearch filter for a single
       filter_name, filter_val pair. Note filter_val can
       be a list and an OR will be applied

    Args:
        filter_name (str): Name of filter
        filter_val (str | str[]): Value of filter

    Returns:
        Dict: Valid elasticsearch filter params
    """
    if isinstance(filter_val, list):
        filters = [_make_singular_filter(filter_name, val) for val in filter_val]
        return {"bool": {"should": filters}}
    return {"match": {filter_name: filter_val}}


def _match_filters(filters):
    if not filters:
        return {}

    filter_terms = []
    created_at_filter = {}

    for f in filters:
        filter_name = str(f[0]).lower()
        filter_val = (
            str(f[1]).lower()
            if not isinstance(f[1], list)
            else [str(v).lower() for v in f[1]]
        )

        if not filter_val or filter_val == "":
            continue

        if filter_name == "startdate":
            created_at_filter["gte"] = filter_val
        elif filter_name == "enddate":
            created_at_filter["lte"] = filter_val
        else:
            filter_terms.append(_make_singular_filter(filter_name, filter_val))
    filters = {"filter": {"bool": {"must": filter_terms}}}
    if created_at_filter:
        filters["range"] = {"created_at": created_at_filter}
    return filters


def _construct_datadoc_query(
    keywords, filters, fields, limit, offset, sort_key=None, sort_order=None,
):
    # TODO: fields is not used because explicit search for Data Docs is not implemented
    search_query = _match_any_field(
        keywords, search_fields=["title^5", "cells", "owner",],
    )
    search_filter = _match_filters(filters)
    if search_filter == {}:
        search_filter["filter"] = {"bool": {}}
    search_filter["filter"]["bool"]["should"] = _data_doc_access_terms(current_user.id)

    bool_query = {}
    if search_query != {}:
        bool_query["must"] = [search_query]
    if search_filter != {}:
        bool_query["filter"] = search_filter["filter"]
        if "range" in search_filter:
            bool_query.setdefault("must", [])
            bool_query["must"].append({"range": search_filter["range"]})

    query = {
        "query": {"bool": bool_query},
        "_source": ["id", "title", "owner_uid", "created_at"],
        "size": limit,
        "from": offset,
    }

    if sort_key:
        if not isinstance(sort_key, list):
            sort_key = [sort_key]
            sort_order = [sort_order]
        sort_query = [
            {val: {"order": order}} for order, val in zip(sort_order, sort_key)
        ]

        query.update({"sort": sort_query})
    query.update(
        _highlight_fields({"cells": {"fragment_size": 60, "number_of_fragments": 3,}})
    )

    return json.dumps(query)


def _data_doc_access_terms(user_id):
    return [
        {"term": {"owner_uid": user_id}},
        {"term": {"readable_user_ids": user_id}},
        {"term": {"public": True}},
    ]


def _match_table_word_fields(fields):
    search_fields = []
    for field in fields:
        # 'table_name', 'description', and 'column' are fields used by Table search
        if field == "table_name":
            search_fields.append("full_name^2")
            search_fields.append("full_name_ngram")
        elif field == "description":
            search_fields.append("description")
        elif field == "column":
            search_fields.append("columns")
    return search_fields


def _match_table_phrase_queries(fields, keywords):
    phrase_queries = []
    for field in fields:
        if field == "table_name":
            phrase_queries.append(
                {"match_phrase": {"full_name": {"query": keywords, "boost": 10}}}
            )
        elif field == "column":
            phrase_queries.append({"match_phrase": {"columns": {"query": keywords}}})
    return phrase_queries


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


def _construct_tables_query(
    keywords, filters, fields, limit, offset, concise, sort_key=None, sort_order=None,
):
    search_query = {}
    if keywords:
        search_query = {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": keywords,
                        "fields": _match_table_word_fields(fields),
                        # All words must appear in a field
                        "operator": "and",
                    },
                },
                "should": _match_table_phrase_queries(fields, keywords),
            }
        }
    else:
        search_query = {"match_all": {}}

    search_query = {
        "function_score": {
            "query": search_query,
            "boost_mode": "multiply",
            "script_score": {
                "script": {
                    "source": "1 + (doc['importance_score'].value + (doc['golden'].value ? 1 : 0))"
                }
            },
        }
    }

    search_filter = _match_filters(filters)

    bool_query = {}
    if search_query != {}:
        bool_query["must"] = [search_query]
    if search_filter != {}:
        bool_query["filter"] = search_filter["filter"]
        if "range" in search_filter:
            bool_query["must"].append({"range": search_filter["range"]})

    query = {
        "query": {"bool": bool_query},
        "size": limit,
        "from": offset,
    }

    if concise:
        query["_source"] = ["id", "full_name", "name"]

    if sort_key:
        if not isinstance(sort_key, list):
            sort_key = [sort_key]
            sort_order = [sort_order]
        sort_query = [
            {val: {"order": order}} for order, val in zip(sort_order, sort_key)
        ]

        query.update({"sort": sort_query})
    query.update(
        _highlight_fields(
            {
                "columns": {"fragment_size": 20, "number_of_fragments": 5,},
                "description": {"fragment_size": 60, "number_of_fragments": 3,},
            }
        )
    )

    return json.dumps(query)


def _parse_results(results, get_count):
    def extract_hits(results):
        return results.get("hits", {}).get("hits", [])

    ret = []
    elements = extract_hits(results)
    for element in elements:
        r = element.get("_source", {})
        if element.get("highlight"):
            r.update({"highlight": element.get("highlight")})
        ret.append(r)

    if get_count:
        total_found = results.get("hits", {}).get("total", 0)
        return ret, total_found

    return ret


def _get_matching_objects(query, index_name, doc_type, get_count=False):
    result = None
    try:
        result = get_hosted_es().search(index_name, doc_type, body=query)
    except Exception as e:
        LOG.warning("Got ElasticSearch exception: \n " + str(e))

    if result is None:
        LOG.debug("No Elasticsearch attempt succeeded")
        result = {}
    return _parse_results(result, get_count)


@register("/search/datadoc/", methods=["GET"])
def search_datadoc(
    environment_id,
    keywords,
    filters=[],
    fields=[],
    sort_key=None,
    sort_order=None,
    limit=1000,
    offset=0,
):
    verify_environment_permission([environment_id])
    filters.append(["environment_id", environment_id])

    query = _construct_datadoc_query(
        keywords=keywords,
        filters=filters,
        fields=fields,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    results, count = _get_matching_objects(
        query,
        ES_CONFIG["datadocs"]["index_name"],
        ES_CONFIG["datadocs"]["type_name"],
        True,
    )
    return {"count": count, "results": results}


@register("/schemas/", methods=["GET"])
def get_schemas(metastore_id, limit=5, offset=0, sort_key="name", sort_order="desc"):
    verify_metastore_permission(metastore_id)
    schema, done = logic.get_all_schema(
        metastore_id, offset, limit, sort_key, sort_order
    )
    return {"results": schema, "done": done}


@register("/search/tables/", methods=["GET"])
def search_tables(
    metastore_id,
    keywords,
    filters=[],
    fields=[],
    sort_key=None,
    sort_order=None,
    limit=1000,
    offset=0,
    concise=False,
):
    verify_metastore_permission(metastore_id)
    filters.append(["metastore_id", metastore_id])

    query = _construct_tables_query(
        keywords=keywords,
        filters=filters,
        fields=fields,
        limit=limit,
        offset=offset,
        concise=concise,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    results, count = _get_matching_objects(
        query,
        ES_CONFIG["tables"]["index_name"],
        ES_CONFIG["tables"]["type_name"],
        True,
    )
    return {"count": count, "results": results}


@register("/suggest/<int:metastore_id>/tables/", methods=["GET"])
def suggest_tables(metastore_id, prefix, limit=10):
    verify_metastore_permission(metastore_id)

    query = {
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

    index_name = ES_CONFIG["tables"]["index_name"]
    type_name = ES_CONFIG["tables"]["type_name"]

    result = None
    try:
        result = get_hosted_es().search(index_name, type_name, body=query)
    except Exception as e:
        LOG.info(e)
    finally:
        if result is None:
            result = {}
    options = next(iter(result.get("suggest", {}).get("suggest", [])), {}).get(
        "options", []
    )
    texts = [
        "{}.{}".format(
            option.get("_source", {}).get("schema", ""),
            option.get("_source", {}).get("name", ""),
        )
        for option in options
    ]
    return texts


# /search/ but it is actually suggest
@register("/search/user/", methods=["GET"])
def suggest_user(name, limit=10, offset=None):
    api_assert(limit is None or limit <= 100, "Requesting too many users")

    query = {
        "suggest": {
            "suggest": {
                "text": (name or "").lower(),
                "completion": {"field": "suggest", "size": limit},
            }
        },
    }

    index_name = ES_CONFIG["users"]["index_name"]
    type_name = ES_CONFIG["users"]["type_name"]

    result = None
    try:
        # print '\n--ES latest hosted_index %s\n' % hosted_index
        result = get_hosted_es().search(index_name, type_name, body=query)
    except Exception as e:
        LOG.info(e)
    finally:
        if result is None:
            result = {}

    options = next(iter(result.get("suggest", {}).get("suggest", [])), {}).get(
        "options", []
    )
    users = [
        {
            "id": option.get("_source", {}).get("id"),
            "username": option.get("_source", {}).get("username"),
            "fullname": option.get("_source", {}).get("fullname"),
        }
        for option in options
    ]
    return users
