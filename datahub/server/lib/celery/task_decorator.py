import functools

from app.flask_app import celery
from clients.redis_client import semi_incr, semi_decr, with_redis
from lib.utils.cache import make_template_fragment_key


def debounced_task(countdown=10, cache_key=None, **options):  # Delay in seconds
    """Execute the task only after no call with the cache key during countdown
       Debounced task can only return void
    Keyword Arguments:
        countdown {int} -- (default: {10})
        cache_key {[type]} -- (default: {None})
    """

    def wrapper(fn):
        _cache_key = (
            celery.gen_task_name(fn.__name__, fn.__module__)
            if cache_key is None
            else cache_key
        )

        @functools.wraps(fn)
        def inner_task(*args, **kwargs):
            if semi_decr(make_template_fragment_key(_cache_key, [args, kwargs])):
                # Task is done getting debounced
                return fn(*args, **kwargs)

        inner_task.__raw__ = fn

        task = celery._task_from_fun(inner_task, **options, name=_cache_key)

        @functools.wraps(fn)
        def debounced_task(*args, countdown=countdown, **kwargs):
            semi_incr(
                make_template_fragment_key(_cache_key, [args, kwargs]),
                # Assume the inner debounced task can execute within 10 minutes of countdown
                countdown + 60 * 10,
            )
            task.apply_async(args=args, kwargs=kwargs, countdown=countdown)

        debounced_task.__raw__ = fn

        return celery._task_from_fun(
            debounced_task, **options, name=_cache_key + "__debouncer"
        )

    return wrapper


def throttled_task(throttle_for=10, cache_key=None, **options):
    """After the initial execution, wait for countdown and allow another execution
       Throttled task can only return void
    Keyword Arguments:
        countdown {int} -- (default: {10})
        cache_key {[type]} -- (default: {None})
    """

    def wrapper(fn):
        _cache_key = (
            celery.gen_task_name(fn.__name__, fn.__module__)
            if cache_key is None
            else cache_key
        )

        @functools.wraps(fn)
        @with_redis
        def throttled_task(*args, throttle_for=throttle_for, redis_conn=None, **kwargs):
            redis_key = make_template_fragment_key(_cache_key, [args, kwargs])
            has_called = redis_conn.exists(redis_key)
            if has_called > 0:
                # If this throttled task was called before
                return

            # Increment the key and set throttle counter
            semi_incr(redis_key, throttle_for, redis_conn=redis_conn)

            fn(*args, **kwargs)

        throttled_task.__raw__ = fn

        return celery._task_from_fun(
            throttled_task, **options, name=_cache_key + "__throttler"
        )

    return wrapper
