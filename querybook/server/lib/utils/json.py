from datetime import datetime, date
import json

from flask import json as flask_json
from sqlalchemy.engine.row import Row

from lib.utils.utils import DATE_TO_UTC, DATETIME_TO_UTC


class JSONEncoder(flask_json.JSONEncoder):
    def __init__(self, *args, **kwargs):
        self.date_formatter = kwargs.pop("date_formatter", DATE_TO_UTC)
        self.datetime_formatter = kwargs.pop("datetime_formatter", DATETIME_TO_UTC)

        kwargs.setdefault("indent", None)
        kwargs.setdefault("separators", (",", ":"))

        super(JSONEncoder, self).__init__(*args, **kwargs)

    def default(self, obj):  # pylint: disable=E0202
        if hasattr(obj, "to_dict"):
            return obj.to_dict()
        # check for NamedTuple
        elif isinstance(obj, tuple) and hasattr(obj, "_fields"):
            return obj._asdict()
        elif isinstance(obj, datetime):
            return self.datetime_formatter(obj)
        elif isinstance(obj, date):
            return self.date_formatter(obj)
        elif isinstance(obj, Row):
            return list(obj)


def dumps(*args, **kwargs):
    return json.dumps(cls=JSONEncoder, *args, *kwargs)


def pdumps(*args, **kwargs):
    return json.dumps(
        cls=JSONEncoder, indent=4, separators=(",", ": "), *args, **kwargs
    )


def loads(*args, **kwargs):
    return json.loads(*args, **kwargs)


def safe_loads(*args, default_value=None, **kwargs):
    try:
        return loads(*args, **kwargs)
    except json.JSONDecodeError:
        return default_value
