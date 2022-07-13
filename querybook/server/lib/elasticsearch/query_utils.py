from typing import Dict, List, Tuple, Union
from lib.logger import get_logger

LOG = get_logger(__file__)


def highlight_fields(fields_to_highlight):
    return {
        "highlight": {
            "pre_tags": ["<mark>"],
            "post_tags": ["</mark>"],
            "type": "plain",
            "fields": fields_to_highlight,
        }
    }


def match_any_field(keywords="", search_fields=[]):
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


def _make_singular_filter(filter_name: str, filter_val, and_filter_names: List[str]):
    """Create a elasticsearch filter for a single
       filter_name, filter_val pair. Note filter_val can
       be a list and if the filter_name is in and_filter_names,
       and AND will be applied to the list, otherwise an OR
       will be applied

    Args:
        filter_name (str): Name of filter
        filter_val (str | str[]): Value of filter
        and_filter_names (List[str]): list of filter names that should use AND instead of OR

    Returns:
        Dict: Valid elasticsearch filter params
    """
    if isinstance(filter_val, list):
        filters = [
            _make_singular_filter(filter_name, val, and_filter_names)
            for val in filter_val
        ]
        query_type = "must" if filter_name in and_filter_names else "should"
        return {"bool": {query_type: filters}}
    return {"match": {filter_name: filter_val}}


def match_filters(filters: List[Tuple[str, str]], and_filter_names: List[str] = []):
    if not filters:
        return {}

    filter_terms = []
    created_at_filter = {}
    duration_filter = {}

    for f in filters:
        filter_name = str(f[0]).lower()
        filter_val = f[1]

        if filter_val is None or (
            hasattr(filter_val, "__len__") and len(filter_val) == 0
        ):
            continue

        if filter_name == "startdate":
            created_at_filter["gte"] = filter_val
        elif filter_name == "enddate":
            created_at_filter["lte"] = filter_val
        elif filter_name == "minduration":
            duration_filter["gte"] = filter_val
        elif filter_name == "maxduration":
            duration_filter["lte"] = filter_val
        else:
            filter_terms.append(
                _make_singular_filter(filter_name, filter_val, and_filter_names)
            )

    filter_query = {"filter": {"bool": {"must": filter_terms}}}
    if created_at_filter:
        filter_query["range"] = [
            {
                "range": {
                    "created_at": created_at_filter,
                }
            }
        ]
    if duration_filter:
        filter_query.setdefault("range", [])
        filter_query["range"].append(
            {
                "range": {
                    "duration": duration_filter,
                }
            }
        )
    return filter_query


def order_by_fields(sort_key: Union[str, List[str]], sort_order: Union[str, List[str]]):
    if not sort_key:
        return {}

    if not isinstance(sort_key, list):
        sort_key = [sort_key]
        sort_order = [sort_order]

    sort_query = [{val: {"order": order}} for order, val in zip(sort_order, sort_key)]

    return {"sort": sort_query}


def combine_keyword_and_filter_query(keyword_query: Dict, filter_query: Dict):
    bool_query = {}
    if keyword_query != {}:
        bool_query["must"] = [keyword_query]
    if filter_query != {}:
        bool_query["filter"] = filter_query["filter"]
        if "range" in filter_query:
            bool_query.setdefault("must", [])
            bool_query["must"] += filter_query["range"]

    return bool_query
