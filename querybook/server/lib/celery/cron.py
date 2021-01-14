# Helper functions to validate cron
from celery.schedules import crontab_parser, ParseException


def validate_cron(expression: str) -> bool:
    """Validate whether or not the cron tab expression is valid

    Arguments:
        expression {str} -- A cron tab express

    Returns:
        bool -- True if valid cron expression, false otherwise
    """

    if not isinstance(expression, str):
        return False

    parts = expression.split(" ")
    if len(parts) != 5:
        return False

    minute, hour, day_of_month, month_of_year, day_of_week = parts

    try:
        crontab_parser(60).parse(minute)
        crontab_parser(24).parse(hour)
        crontab_parser(7).parse(day_of_week)
        crontab_parser(31, 1).parse(day_of_month)
        crontab_parser(12, 1).parse(month_of_year)
    except (ValueError, ParseException):
        return False

    return True
