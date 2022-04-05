from app.flask_app import limiter
from app.datasource import register
from lib.change_log import get_change_log_list, get_change_log_content_by_date


@register("/utils/change_logs/")
def get_change_logs_list(limit=None, last_viewed_date=None):
    change_log_list = get_change_log_list(limit=limit, date_after=last_viewed_date)
    return change_log_list or None


@register("/utils/change_log/<date>/")
def get_change_log_by_date(date):
    change_log_text = get_change_log_content_by_date(date=date)
    return change_log_text or None


@register("/utils/ratelimit_test/", methods=["GET"])
@limiter.limit("1 per minute")
def test_ratelimit():
    """
    Endpoint to ensure ratelimit works in prod
    """
    return "yes"
