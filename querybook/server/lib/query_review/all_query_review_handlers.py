from typing import Optional
from lib.utils.import_helper import import_module_with_default
from lib.query_review.base_query_review_handler import BaseQueryReviewHandler

PLUGIN_QUERY_REVIEW_HANDLER = import_module_with_default(
    "query_review_handler_plugin",
    "PLUGIN_QUERY_REVIEW_HANDLER",
    default=None,
)


def get_query_review_handler() -> Optional[BaseQueryReviewHandler]:
    """Returns the configured query review handler or None if no plugin is configured"""
    return PLUGIN_QUERY_REVIEW_HANDLER
