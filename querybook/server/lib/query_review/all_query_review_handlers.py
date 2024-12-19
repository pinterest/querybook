from lib.utils.import_helper import import_module_with_default
from lib.query_review.base_query_review_handler import BaseQueryReviewHandler

ALL_PLUGIN_QUERY_REVIEW_HANDLERS = import_module_with_default(
    "query_review_handler_plugin",
    "ALL_PLUGIN_QUERY_REVIEW_HANDLERS",
    default=[BaseQueryReviewHandler()],
)


def get_query_review_handler() -> BaseQueryReviewHandler:
    return ALL_PLUGIN_QUERY_REVIEW_HANDLERS[0]
