from app.flask_app import limiter
from app.datasource import register
from lib.change_log import get_change_logs


@register("/utils/change_log/")
def get_change_log_for_user(last_viewed_date=None):
    change_log_text = get_change_logs(date_after=last_viewed_date)
    return change_log_text or None


@register("/utils/ratelimit_test/", methods=["GET"])
@limiter.limit("1 per minute")
def test_ratelimit():
    """
        Endpoint to ensure ratelimit works in prod
    """
    return "yes"
