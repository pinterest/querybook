# Helper functions to validate cron
from celery.schedules import crontab_parser, ParseException

# Max day a month can ever have; Feb=29 keeps leap-year "0 0 29 2 *" valid
_MAX_DAY_IN_MONTH = {
    1: 31,
    2: 29,
    3: 31,
    4: 30,
    5: 31,
    6: 30,
    7: 31,
    8: 31,
    9: 30,
    10: 31,
    11: 30,
    12: 31,
}


def validate_cron(expression: str) -> bool:
    """Validate whether or not the cron tab expression is valid

    In addition to validating each field independently, this also performs a
    cross-field calendar check so that calendar-impossible schedules such as
    "0 0 30 2 *" (Feb 30) or "0 0 31 4 *" (Apr 31) are rejected.

    Arguments:
        expression {str} -- A cron tab express

    Returns:
        bool -- True if valid cron expression, false otherwise
    """

    if not isinstance(expression, str):
        return False

    parts = expression.split()
    if len(parts) != 5:
        return False

    minute, hour, day_of_month, month_of_year, day_of_week = parts

    try:
        crontab_parser(60).parse(minute)
        crontab_parser(24).parse(hour)
        crontab_parser(7).parse(day_of_week)
        days = crontab_parser(31, 1).parse(day_of_month)
        months = crontab_parser(12, 1).parse(month_of_year)
    except (ValueError, ParseException):
        return False

    # Cross-field: at least one (month, day-of-month) combination must be a
    # real calendar date. Under celery's crontab AND-semantics, an impossible
    # (month, day) pair never fires regardless of day-of-week.
    if not any(day <= _MAX_DAY_IN_MONTH[month] for month in months for day in days):
        return False

    return True
