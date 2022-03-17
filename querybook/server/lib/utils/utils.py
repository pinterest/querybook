import inspect
import signal
import subprocess
from datetime import datetime, date
from functools import wraps

from lib.logger import get_logger

LOG = get_logger(__file__)
_epoch = datetime.utcfromtimestamp(0)


def DATE_TO_UTC(dt: date) -> int:
    """Return a string representation of date
    Note: In our models we normally define now
    as datetime.datetime.utcnow however our db
    doesn't seem to be storing the ms, therefore
    we don't have ms resolution and thus we
    return the result in seconds instead of ms
    at least for the time being.
    """
    return (
        int((datetime.combine(dt, datetime.min.time()) - _epoch).total_seconds())
        if dt
        else None
    )


def DATETIME_TO_UTC(dt: datetime) -> int:
    """Return a string representation of date
    Note: In our models we normally define now
    as datetime.datetime.utcnow however our db
    doesn't seem to be storing the ms, therefore
    we don't have ms resolution and thus we
    return the result in seconds instead of ms
    at least for the time being.
    """
    return int((dt - _epoch).total_seconds()) if dt else None


def DATE_STRING(dt):
    """Return a string representation of date"""
    return dt.strftime("%Y-%m-%d")


def DATETIME_STRING(dt):
    """Return a string representation of datetime"""

    return dt.isoformat()


def with_exception(func):
    @wraps(func)
    def decorator(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            return result
        except Exception as e:
            import traceback

            LOG.info("error: {}\n".format(e) + traceback.format_exc())

    return decorator


def run_bash(bash_command: str):
    process = subprocess.Popen(bash_command.split(), stdout=subprocess.PIPE)
    output, error = process.communicate()
    return output, error


def map_dict(d, f_value=lambda x: x, f_key=lambda x: x):
    """Apply a map function to every value in the dictionary

    Arguments:
        d {[Dict]} -- [dictionary of any type]
        f_value {[Func]} -- [func that takes the values in dictonary, default to identity]
        f_key {[Func]} -- [func that takes the keys in dictonary, default to identity]
    Returns:
        [Dict] -- [A new dictionary with every value mapped]
    """
    return {f_key(k): f_value(v) for k, v in d.items()}


# from https://stackoverflow.com/questions/8464391/what-should-i-do-if-socket-setdefaulttimeout-is-not-working
# Note: don't use this in the main gevent loop (don't use it in web)
"""Timeout class using ALARM signal"""


class TimeoutError(Exception):
    pass


class Timeout:
    def __init__(self, sec, custom_error_message=None):
        self.error_message = custom_error_message or f"Timeout Exception: {sec} seconds"
        self.sec = sec

    def __enter__(self):
        signal.signal(signal.SIGALRM, self.raise_timeout)
        signal.alarm(self.sec)

    def __exit__(self, *args):
        signal.alarm(0)  # disable alarm

    def raise_timeout(self, *args):
        raise TimeoutError(self.error_message)


# from: https://stackoverflow.com/questions/12627118/get-a-function-arguments-default-value
def get_default_args(func):
    signature = inspect.signature(func)
    return {
        k: v.default
        for k, v in signature.parameters.items()
        if v.default is not inspect.Parameter.empty
    }
