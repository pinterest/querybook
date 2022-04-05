from functools import wraps
from datetime import datetime
from app.db import with_session
from lib.utils import json
from logic.result_store import get_key_value_store, upsert_key_value_store
from tasks.delete_mysql_cache import delete_mysql_cache


@with_session
def set_key(
    key,
    value,
    expires_after=None,
    serialize=True,
    session=None,
):
    if serialize:
        value = json.dumps(value)

    upsert_key_value_store(key, value, session=session)
    if expires_after is not None:
        delete_mysql_cache.delay(key, countdown=expires_after)


@with_session
def get_raw_key(key, expires_after=None, serialize=True, session=None):
    kvs = get_key_value_store(key, session=session)
    if not kvs:
        raise LookupError(f"Invalid key {key}")
    if expires_after is not None:
        if (datetime.utcnow() - kvs.updated_at).total_seconds() > expires_after:
            raise LookupError(f"Invalid key {key}")
    kvs_dict = kvs.to_dict()
    if serialize:
        kvs_dict["value"] = json.loads(kvs_dict["value"])
    return kvs_dict


@with_session
def get_key(key, expires_after=None, serialize=True, session=None):
    return get_raw_key(
        key=key, expires_after=expires_after, serialize=serialize, session=session
    )["value"]


def cache_first_call_function(
    cache_key,
    expires_after,
    fn,
    serialize=True,
    args=[],
    kwargs={},
):
    """Check if we can fetch from cache, if not
    call function and update the cache
    """
    result_from_cache = True
    try:
        result = get_key(cache_key, expires_after=expires_after, serialize=serialize)
    except LookupError:
        result_from_cache = False  # Need to call function

    if not result_from_cache:
        result = fn(*args, **kwargs)

        set_key(cache_key, result, expires_after=expires_after, serialize=serialize)

    return result


def with_mysql_cache(cache_key, expires_after, serialize=True):
    def wrapper(fn):
        @wraps(fn)
        def handler(*args, **kwargs):
            return cache_first_call_function(
                cache_key,
                expires_after,
                fn,
                serialize=serialize,
                args=args,
                kwargs=kwargs,
            )

        handler.__raw__ = fn
        return handler

    return wrapper
