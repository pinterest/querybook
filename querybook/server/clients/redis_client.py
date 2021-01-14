import redis
import functools

from env import QuerybookSettings


__redis = None


def get_redis():
    global __redis
    if not __redis:
        __redis = redis.from_url(QuerybookSettings.REDIS_URL)
    return __redis


def with_redis(fn):
    """Decorator for handling redis connections."""

    @functools.wraps(fn)
    def func(*args, **kwargs):
        conn = None
        # If there's no session, create a new one. We will
        # automatically close this after the function is called.
        if not kwargs.get("redis_conn"):
            conn = get_redis()
            kwargs["redis_conn"] = conn

        result = fn(*args, **kwargs)
        return result

    return func


@with_redis
def semi_incr(key, expiration=None, redis_conn=None):
    with redis_conn.pipeline() as pipe:
        pipe.incr(key)
        if expiration is not None:
            pipe.expire(key, expiration)
        pipe.execute()


@with_redis
def semi_decr(key, redis_conn: redis.Redis = None):
    value = redis_conn.decr(key) <= 0
    if value:
        redis_conn.delete(key)
    return value
