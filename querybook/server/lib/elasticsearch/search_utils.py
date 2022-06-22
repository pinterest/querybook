from typing import Dict, Union
from lib.logger import get_logger
from logic.elasticsearch import get_hosted_es

LOG = get_logger(__file__)


def _parse_results(results, get_count):
    hits = results.get("hits", {})
    ret = []
    elements = hits.get("hits", [])
    for element in elements:
        r = element.get("_source", {})
        if element.get("highlight"):
            r.update({"highlight": element.get("highlight")})
        ret.append(r)

    if get_count:
        total_found = hits.get("total", {}).get("value", 0)
        return ret, total_found

    return ret


def get_matching_objects(query: Union[str, Dict], index_name, get_count=False):
    result = None
    try:
        result = get_hosted_es().search(index=index_name, body=query)
    except Exception as e:
        LOG.warning("Got ElasticSearch exception: \n " + str(e))

    if result is None:
        LOG.debug("No Elasticsearch attempt succeeded")
        result = {}
    return _parse_results(result, get_count)


def get_matching_suggestions(query: Union[str, Dict], index_name: str):
    result = None
    try:
        result = get_hosted_es().search(index=index_name, body=query)
    except Exception as e:
        LOG.warning(e)
    finally:
        if result is None:
            result = {}

    options = next(iter(result.get("suggest", {}).get("suggest", [])), {}).get(
        "options", []
    )

    return options
