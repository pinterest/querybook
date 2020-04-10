from functools import wraps
from enum import Enum

from datetime import datetime, date
from lib.utils.utils import DATE_TO_UTC, DATETIME_TO_UTC

# This is specialized for serializing sqlalchemy models


def serialize_value(value):
    if value:
        # TODO: since jsonsify also converts
        # Decide on which conversion is required
        if isinstance(value, datetime):
            return DATETIME_TO_UTC(value)
        elif isinstance(value, date):
            return DATE_TO_UTC(value)
        elif isinstance(value, Enum):
            return value.value
        elif isinstance(value, dict):
            return {k: serialize_value(v) for k, v in value.items()}
        elif isinstance(value, (list, tuple)):
            return value.__class__(map(serialize_value, value))
        elif hasattr(value, "to_dict"):
            return value.to_dict()
    return value


def with_formatted_date(func):
    @wraps(func)
    def decorator(*args, **kwargs):
        return serialize_value(func(*args, **kwargs))

    return decorator
