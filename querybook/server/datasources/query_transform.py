from app.datasource import register
from lib.query_analysis.transform import (
    has_query_contains_unlimited_select,
    transform_to_limited_query,
    transform_to_sampled_query,
)


@register("/query/transform/limited/", methods=["POST"])
def query_limited(
    query: str,
    row_limit: int,
    language: str,
):
    limited_query = transform_to_limited_query(
        query=query, limit=row_limit, language=language
    )

    unlimited_select = has_query_contains_unlimited_select(
        query=limited_query, language=language
    )

    return {"query": limited_query, "unlimited_select": unlimited_select}


@register("/query/transform/sampling/", methods=["POST"])
def query_sampling(
    query: str,
    language: str,
    sampling_tables: dict[str, dict[str, str]],
):
    return transform_to_sampled_query(
        query=query, language=language, sampling_tables=sampling_tables
    )


@register("/query/transform/", methods=["POST"])
def query_transform(
    query: str,
    language: str,
    row_limit: int,
    sampling_tables: dict[str, dict[str, str]],
):
    sampled_query = transform_to_sampled_query(
        query=query, language=language, sampling_tables=sampling_tables
    )

    limited_query = transform_to_limited_query(
        query=sampled_query, limit=row_limit, language=language
    )

    unlimited_select = has_query_contains_unlimited_select(
        query=limited_query, language=language
    )

    return {"query": limited_query, "unlimited_select": unlimited_select}
