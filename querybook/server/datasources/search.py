from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_metastore_permission,
)
from app.datasource import register, api_assert
from lib.logger import get_logger
from lib.elasticsearch.search_datadoc import construct_datadoc_query
from lib.elasticsearch.search_query import construct_query_search_query
from lib.elasticsearch.search_table import construct_tables_query
from lib.elasticsearch.search_board import construct_board_query
from lib.elasticsearch.search_utils import (
    get_matching_objects,
    get_matching_suggestions,
)
from lib.elasticsearch.suggest_table import construct_suggest_table_query
from lib.elasticsearch.suggest_user import construct_suggest_user_query
from logic.elasticsearch import ES_CONFIG

LOG = get_logger(__file__)


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

    query = construct_datadoc_query(
        uid=current_user.id,
        keywords=keywords,
        filters=filters,
        fields=fields,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    results, count = get_matching_objects(
        query, ES_CONFIG["datadocs"]["index_name"], True
    )
    return {"count": count, "results": results}


@register("/search/queries/", methods=["GET"])
def search_query(
    environment_id,
    keywords,
    filters=[],
    sort_key=None,
    sort_order=None,
    limit=1000,
    offset=0,
):
    verify_environment_permission([environment_id])
    filters.append(["environment_id", environment_id])

    query = construct_query_search_query(
        uid=current_user.id,
        keywords=keywords,
        filters=filters,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    index_name = "{},{}".format(
        ES_CONFIG["query_cells"]["index_name"],
        ES_CONFIG["query_executions"]["index_name"],
    )

    results, count = get_matching_objects(query, index_name, True)
    return {"count": count, "results": results}


@register("/search/tables/", methods=["GET"])
def search_tables(
    metastore_id,
    keywords,
    filters=None,
    fields=None,
    sort_key=None,
    sort_order=None,
    limit=1000,
    offset=0,
    concise=False,
):
    filters = filters or []
    fields = fields or []
    verify_metastore_permission(metastore_id)
    filters.append(["metastore_id", metastore_id])

    query = construct_tables_query(
        keywords=keywords,
        filters=filters,
        fields=fields,
        limit=limit,
        offset=offset,
        concise=concise,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    results, count = get_matching_objects(
        query, ES_CONFIG["tables"]["index_name"], True
    )
    return {"count": count, "results": results}


@register("/suggest/<int:metastore_id>/tables/", methods=["GET"])
def suggest_tables(metastore_id, prefix, limit=10):
    api_assert(limit is None or limit <= 100, "Requesting too many tables")
    verify_metastore_permission(metastore_id)

    query = construct_suggest_table_query(prefix, limit, metastore_id)
    options = get_matching_suggestions(query, ES_CONFIG["tables"]["index_name"])
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
def suggest_user(name, limit=10):
    api_assert(limit is None or limit <= 100, "Requesting too many users")

    query = construct_suggest_user_query(prefix=name, limit=limit)
    options = get_matching_suggestions(query, ES_CONFIG["users"]["index_name"])

    users = [
        {
            "id": option.get("_source", {}).get("id"),
            "username": option.get("_source", {}).get("username"),
            "fullname": option.get("_source", {}).get("fullname"),
        }
        for option in options
    ]
    return users


@register("/search/board/", methods=["GET"])
def search_board(
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

    query = construct_board_query(
        uid=current_user.id,
        keywords=keywords,
        filters=filters,
        fields=fields,
        limit=limit,
        offset=offset,
        sort_key=sort_key,
        sort_order=sort_order,
    )
    results, count = get_matching_objects(
        query, ES_CONFIG["boards"]["index_name"], True
    )
    return {"count": count, "results": results}
