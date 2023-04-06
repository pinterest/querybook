from lib.elasticsearch.query_utils import (
    match_filters,
    highlight_fields,
    order_by_fields,
    combine_keyword_and_filter_query,
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
            "boost_mode": "multiply",
            "script_score": {
                "script": {
                    "source": "1 + (doc['importance_score'].value + (doc['golden'].value ? 1 : 0))"
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
