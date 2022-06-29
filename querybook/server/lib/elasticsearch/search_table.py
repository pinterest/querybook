from lib.elasticsearch.query_utils import (
    match_filters,
    highlight_fields,
    order_by_fields,
    combine_keyword_and_filter_query,
)


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
                "should": _match_table_phrase_queries(fields, keywords),
            }
        }
    else:
        keywords_query = {"match_all": {}}

    keywords_query = {
        "function_score": {
            "query": keywords_query,
            "boost_mode": "multiply",
            "script_score": {
                "script": {
                    "source": "1 + (doc['importance_score'].value + (doc['golden'].value ? 1 : 0))"
                }
            },
        }
    }

    search_filter = match_filters(filters)
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
                "description": {
                    "fragment_size": 60,
                    "number_of_fragments": 3,
                },
            }
        )
    )

    return query
