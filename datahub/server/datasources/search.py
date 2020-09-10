# TODO: refactor
import re
import json
from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_metastore_permission,
    verify_data_table_permission,
)
from app.datasource import register, api_assert
from lib.logger import get_logger
from logic.elasticsearch import ES_CONFIG, get_hosted_es


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
            created_at_filter["gte"] = {filter_name: filter_val}
        elif filter_name == "enddate":
            created_at_filter["lte"] = {filter_name: filter_val}
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
        keywords, search_fields=["title^5", "cells", "owner",]
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


def _match_table_fields(fields):
    search_fields = []
    for field in fields:
        # 'table_name', 'description', and 'column' are fields used by Table search
        if field == "table_name":
            search_fields.append("full_name^20")
        elif field == "description":
            search_fields.append("description")
        elif field == "column":
            search_fields.append("columns")

    return search_fields


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

    search_fields = _match_table_fields(fields)

    search_query = {}
    if keywords:
        search_query["multi_match"] = {
            "query": keywords,
            "fields": search_fields,
            "minimum_should_match": -1,
        }
    else:
        search_query["match_all"] = {}

    search_query = {
        "function_score": {
            "query": search_query,
            "boost_mode": "multiply",
            "script_score": {
                "script": {
                    "source": "doc['importance_score'].value + (doc['golden'].value ? 2 : 0)"
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
        query["_source"] = ["id", "schema", "name"]

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


def _data_table_data_cell_filter_bool(table_id, access_filter=False, uid=None):
    bool_filter = {}
    must_terms = [{"term": {"tables": table_id}}]
    if uid:
        must_terms.append({"term": {"latest_execution_uid": uid}})
    if access_filter:
        bool_filter["should"] = [
            {"term": {"readable_uids": current_user.id}},
            {"term": {"public": True}},
        ]

    bool_filter["must"] = must_terms
    return {"bool": bool_filter}


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
    # Unfortunately currently we can't search including underscore,
    # so split. # TODO: Allow for both.
    # parsed_keywords = map(lambda x: re.split('(-|_)', x), keywords)
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
    return {"count": count, "data": results}


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
    # Unfortuantely currently we can't search including underscore,
    # so split. # TODO: Allow for both.
    parsed_keywords = " ".join(re.split("-|_|\\.", keywords))
    query = _construct_tables_query(
        keywords=parsed_keywords,
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
    return {"count": count, "data": results}


@register("/suggest/<int:metastore_id>/tables/", methods=["GET"])
def suggest_tables(metastore_id, prefix, limit=10):
    verify_metastore_permission(metastore_id)
    # Unfortuantely currently we can't search including underscore,
    # so split. # TODO: Allow for both.
    # parsed_keywords = map(lambda x: re.split('(-|_)', x), keywords)
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
    texts = [
        "{}.{}".format(
            option.get("_source", {}).get("schema", ""),
            option.get("_source", {}).get("name", ""),
        )
        for option in options
    ]
    return {"data": texts}


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


@register("/search/data_cell_data_tables/<int:table_id>/", methods=["GET"])
def get_data_cell_data_tables(table_id, environment_id, uid=None, limit=10, offset=0):
    verify_environment_permission([environment_id])
    verify_data_table_permission(table_id)
    return get_data_table_query_executions(
        table_id, uid=uid, limit=limit, offset=offset, access_filter=True
    )


@register("/search/data_table_query_users/<int:table_id>/", methods=["GET"])
def get_data_tables_users(table_id, environment_id, limit=10):
    verify_environment_permission([environment_id])
    verify_data_table_permission(table_id)
    index_name = ES_CONFIG["data_cell_data_tables"]["index_name"]
    type_name = ES_CONFIG["data_cell_data_tables"]["type_name"]

    query = {
        "aggs": {
            "query_counts": {
                "filter": _data_table_data_cell_filter_bool(
                    table_id, access_filter=True
                ),
                "aggs": {"user_count": {"terms": {"field": "readable_uids"}}},
            }
        },
        "size": limit,
    }
    result = []
    try:
        result = get_hosted_es().search(index_name, type_name, body=query)
    except Exception as e:
        LOG.info(e)
    finally:
        if not result:
            return []
    aggregations = result["aggregations"]
    return [
        {"uid": user_count["key"], "count": user_count["doc_count"]}
        for user_count in aggregations["query_counts"]["user_count"]["buckets"]
    ]


def get_data_table_query_executions(
    table_id, uid=None, limit=None, offset=0, access_filter=True
):
    index_name = ES_CONFIG["data_cell_data_tables"]["index_name"]
    type_name = ES_CONFIG["data_cell_data_tables"]["type_name"]
    search_filter = {
        "filter": _data_table_data_cell_filter_bool(
            table_id, access_filter=access_filter, uid=uid
        )
    }
    query = {
        "query": {"bool": search_filter},
        "from": offset,
        "_source": ["latest_execution_id"],
    }
    if limit:
        query["size"] = limit
    results = _get_matching_objects(query, index_name, type_name)
    return [result["latest_execution_id"] for result in results]
