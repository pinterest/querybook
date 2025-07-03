from typing import Dict, Union

# from elasticsearch import Elasticsearch, RequestsHttpConnection

from env import QuerybookSettings
from lib.config import get_config_value
from lib.logger import get_logger
from lib.utils.decorators import in_mem_memoized

LOG = get_logger(__file__)

ES_CONFIG = get_config_value("elasticsearch")


@in_mem_memoized(3600)
def get_hosted_es():
    hosted_es = None

    # if QuerybookSettings.ELASTICSEARCH_CONNECTION_TYPE == "naive":
    #     hosted_es = Elasticsearch(hosts=QuerybookSettings.ELASTICSEARCH_HOST)
    # elif QuerybookSettings.ELASTICSEARCH_CONNECTION_TYPE == "aws":
    #     # TODO: generialize aws region setup
    #     from boto3 import session as boto_session
    #     from lib.utils.assume_role_aws4auth import AssumeRoleAWS4Auth

    #     credentials = boto_session.Session().get_credentials()
    #     auth = AssumeRoleAWS4Auth(
    #         credentials,
    #         QuerybookSettings.AWS_REGION,
    #         "es",
    #     )
    #     hosted_es = Elasticsearch(
    #         hosts=QuerybookSettings.ELASTICSEARCH_HOST,
    #         http_auth=auth,
    #         connection_class=RequestsHttpConnection,
    #         use_ssl=True,
    #         verify_certs=True,
    #     )
    return hosted_es


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
        # result = get_hosted_es().search(index=index_name, body=query)
        result = []
    except Exception as e:
        LOG.warning("Got ElasticSearch exception: \n " + str(e))

    if result is None:
        LOG.debug("No Elasticsearch attempt succeeded")
        result = {}
    return _parse_results(result, get_count)


def get_matching_suggestions(query: Union[str, Dict], index_name: str):
    result = None
    try:
        # result = get_hosted_es().search(index=index_name, body=query)
        result = []
    except Exception as e:
        LOG.warning(e)
    finally:
        if result is None:
            result = {}

    options = next(iter(result.get("suggest", {}).get("suggest", [])), {}).get(
        "options", []
    )

    return options
