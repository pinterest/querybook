from app.datasource import register
from lib.query_analysis.transform import (
    transform_to_sampled_query,
)


@register("/query/transform/sampling/", methods=["POST"])
def query_sampling(
    query: str,
    language: str,
    sampling_tables: dict[str, dict[str, str]],
):
    return transform_to_sampled_query(
        query=query, language=language, sampling_tables=sampling_tables
    )
