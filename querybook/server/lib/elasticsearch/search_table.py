from typing import Dict, List, Tuple
from lib.elasticsearch.query_utils import (
    match_filters,
    highlight_fields,
    order_by_fields,
    combine_keyword_and_filter_query,
)
from lib.elasticsearch.search_utils import (
    ES_CONFIG,
    get_matching_objects,
)

FILTERS_TO_AND = ["tags", "data_elements"]


def _get_potential_exact_schema_table_name(keywords):
    """Get the schema and table name from a full table name.

    E.g. "default.table_a", will return (default, table_a)
    """
    dot_index = keywords.find(".")
    if dot_index == -1:
        return None, keywords

    return keywords[:dot_index], keywords[dot_index + 1 :]


def _match_table_word_fields(fields):
    search_fields = []
    for field in fields:
        # 'table_name', 'description', and 'column' are fields used by Table search
        if field == "table_name":
            search_fields.append("full_name^2")
            search_fields.append("full_name_ngram^0.2")
        elif field == "description":
            search_fields.append("description")
        elif field == "column":
            search_fields.append("columns")
    return search_fields


def _match_table_phrase_queries(fields, keywords):
    # boos score for phrase match
    return [
        {"match_phrase": {"full_name": {"query": keywords, "boost": 1}}},
        {"match_phrase": {"description": {"query": keywords, "boost": 1}}},
        {"match_phrase": {"column_descriptions": {"query": keywords, "boost": 1}}},
        {
            "match_phrase": {
                "data_element_descriptions": {"query": keywords, "boost": 1}
            }
        },
    ]


def construct_tables_query(
    keywords,
    filters,
    fields,
    limit,
    offset,
    concise,
    sort_key=None,
    sort_order=None,
):
    keywords_query = {}
    if keywords:
        should_clause = _match_table_phrase_queries(fields, keywords)

        table_schema, table_name = _get_potential_exact_schema_table_name(keywords)
        if table_schema:
            filters.append(["schema", table_schema])

        # boost score for table name exact match
        if table_name:
            boost_score = 100 if table_schema else 10
            should_clause.append(
                {"term": {"name": {"value": table_name, "boost": boost_score}}},
            )

        keywords_query = {
            "bool": {
                "must": {
                    "multi_match": {
                        "query": keywords,
                        "fields": _match_table_word_fields(fields),
                        # All words must appear in a field
                        "operator": "and",
                    },
                },
                "should": should_clause,
            }
        }
    else:
        keywords_query = {"match_all": {}}

    keywords_query = {
        "function_score": {
            "query": keywords_query,
            "boost_mode": "sum",
            "script_score": {
                "script": {
                    "source": "doc['importance_score'].value * 10 + (doc['golden'].value ? 50 : 0)"
                }
            },
        }
    }

    search_filter = match_filters(filters, and_filter_names=FILTERS_TO_AND)
    query = {
        "query": {
            "bool": combine_keyword_and_filter_query(keywords_query, search_filter)
        },
        "size": limit,
        "from": offset,
    }

    if concise:
        query["_source"] = ["id", "schema", "name"]

    query.update(order_by_fields(sort_key, sort_order))
    query.update(
        highlight_fields(
            {
                "columns": {
                    "fragment_size": 20,
                    "number_of_fragments": 5,
                },
                "data_elements": {
                    "fragment_size": 20,
                    "number_of_fragments": 5,
                },
                "description": {
                    "fragment_size": 60,
                    "number_of_fragments": 3,
                },
            }
        )
    )

    return query


def construct_tables_query_by_table_names(
    metastore_id: int,
    table_names: list[str],
    filters: list[list[str]],
    limit,
):
    """This query is used to get table information by table names."""
    should_clause = []
    for table_name in table_names:
        schema, name = table_name.split(".")
        should_clause.append(
            {
                "bool": {
                    "must": [
                        {"term": {"schema": schema}},
                        {"term": {"name": name}},
                    ],
                }
            }
        )

    bool_query = {
        "must": [{"term": {"metastore_id": metastore_id}}],
        "should": should_clause,
        "minimum_should_match": 1,
    }

    search_filter = match_filters(filters, and_filter_names=FILTERS_TO_AND)
    if search_filter and search_filter.get("filter"):
        bool_query["filter"] = search_filter["filter"]

    query = {
        "query": {"bool": bool_query},
        "size": limit,
    }

    return query


def get_column_name_suggestion(
    fuzzy_column_name: str, full_table_names: List[str]
) -> Tuple[Dict, int]:
    """Given an invalid column name and a list of tables to search from, uses fuzzy search to search
    the correctly-spelled column name"""
    should_clause = []
    for full_table_name in full_table_names:
        schema_name, table_name = full_table_name.split(".")
        should_clause.append(
            {
                "bool": {
                    "must": [
                        {"match": {"name": table_name}},
                        {"match": {"schema": schema_name}},
                    ]
                }
            }
        )

    search_query = {
        "query": {
            "bool": {
                "must": {
                    "match": {
                        "columns": {"query": fuzzy_column_name, "fuzziness": "AUTO"}
                    }
                },
                "should": should_clause,
                "minimum_should_match": 1,
            },
        },
        "highlight": {"pre_tags": [""], "post_tags": [""], "fields": {"columns": {}}},
    }

    return get_matching_objects(search_query, ES_CONFIG["tables"]["index_name"], True)


def get_table_name_suggestion(
    fuzzy_table_name: str, metastore_id: int
) -> Tuple[Dict, int]:
    """Given an invalid table name use fuzzy search to search the correctly-spelled table name"""

    schema_name, fuzzy_name = None, fuzzy_table_name
    fuzzy_table_name_parts = fuzzy_table_name.split(".")
    if len(fuzzy_table_name_parts) == 2:
        schema_name, fuzzy_name = fuzzy_table_name_parts

    must_clause = [
        {
            "match": {
                "name": {"query": fuzzy_name, "fuzziness": "AUTO"},
            },
        },
        {
            "match": {
                "metastore_id": metastore_id,
            },
        },
    ]
    if schema_name:
        must_clause.append({"match": {"schema": schema_name}})

    search_query = {
        "query": {"bool": {"must": must_clause}},
    }

    return get_matching_objects(search_query, ES_CONFIG["tables"]["index_name"], True)
