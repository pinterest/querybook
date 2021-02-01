import time
import datetime
from functools import wraps


class InMemoryMemoized:
    """Class which will memoize a function, but expires the result after a given period.

    Parameters are ignored for this simple memoize class.

    Flow:
    1) The first result is memoized regardless of the arguments provided.
    2) Subsequent calls will return the same result even if different areguments are provided.
    N) The next call that occurs after the Time To Live (TTL) period resets the state back to (1)
    """

    def __init__(self, func, ttl_secs=None):
        self.func = func
        self.ttl_secs = ttl_secs
        self.last_call_time = None
        self.result = None

    def __call__(self, *args, **kwargs):
        if self.expired:
            self.result = self.func(*args, **kwargs)
            self.last_call_time = datetime.datetime.now()

        return self.result

    @property
    def expired(self):
        if self.last_call_time is None:
            return True
        if (
            self.ttl_secs is not None
            and self.last_call_time + datetime.timedelta(seconds=self.ttl_secs)
            < datetime.datetime.now()
        ):
            return True
        return False


def in_mem_memoized(ttl_secs=None):
    """Memoizes the results of the function.
       Note params change are ignored in memo.

    Args:
        func: A function that will have its results memoized.
        ttl_secs: Time To Live (in seconds) for the result data
                  If ttl_secs, result will never expire

    Returns:
        Memoized function which expires after ttl_secs

    """

    def inner_dec(func):
        return wraps(func)(InMemoryMemoized(func, ttl_secs))

    return inner_dec


def with_exception_retry(
    max_retry=5, get_retry_delay=lambda x: x, exception_cls=Exception
):
    """Automatically retry the function with given exception class

    Keyword Arguments:
        max_retry {int} -- [Max number of retries] (default: {5})
        get_retry_delay {(int): int} -- [Get the time delay between retry] (default: {lambdax:x})
        exception_cls {[Exception]} -- [The exception class to catch] (default: {Exception})

    Raises:
        ex: [If max retry is reached then the exception will be raised]

    Returns:
        Any -- [Returns whatever the function is intended to return]
    """

    def wrapper(func):
        @wraps(func)
        def decorator(*args, **kwargs):
            num_retry = 0
            while True:
                try:
                    return func(*args, **kwargs)
                except exception_cls as ex:
                    if num_retry < max_retry:
                        num_retry += 1
                        time.sleep(get_retry_delay(num_retry))
                    else:
                        raise ex

        return decorator

    return wrapper
