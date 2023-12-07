import sys
from datetime import timedelta

from celery import Celery
from flask import Flask, Blueprint, json as flask_json, has_request_context
from flask_socketio import SocketIO
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache


from const.path import BUILD_PATH, STATIC_PATH, WEBAPP_DIR_PATH
from env import QuerybookSettings
from lib.utils.json import JSONEncoder


def validate_db():
    # We need to make sure db connection is valid
    # before proceeding to other things such as
    # celery or flask server
    if not hasattr(sys, "_called_from_test"):
        from app.db import get_db_engine

        try:
            engine = get_db_engine()
            connection = engine.connect()
            connection.close()
        except Exception:
            raise Exception(
                f"Invalid Database connection string {QuerybookSettings.DATABASE_CONN}"
            )


def make_flask_app():
    app = Flask(__name__, static_folder=STATIC_PATH)
    app.json_encoder = JSONEncoder
    app.secret_key = QuerybookSettings.FLASK_SECRET_KEY

    if QuerybookSettings.LOGS_OUT_AFTER > 0:
        app.permanent_session_lifetime = timedelta(
            seconds=QuerybookSettings.LOGS_OUT_AFTER
        )

    if QuerybookSettings.TABLE_MAX_UPLOAD_SIZE is not None:
        app.config["MAX_CONTENT_LENGTH"] = int(QuerybookSettings.TABLE_MAX_UPLOAD_SIZE)

    return app


def make_cache(app):
    return Cache(
        app,
        config=QuerybookSettings.FLASK_CACHE_CONFIG,
    )


def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=QuerybookSettings.REDIS_URL,
        broker=QuerybookSettings.REDIS_URL,
    )

    celery.conf.update(
        worker_prefetch_multiplier=1,
        worker_max_tasks_per_child=1,
        task_track_started=True,
        task_soft_time_limit=172800,
        worker_proc_alive_timeout=60,
        broker_transport_options={
            # This must be higher than soft time limit,
            # otherwise the task will get retried (in the case of acks_late=True)
            # after visibility timeout
            "visibility_timeout": 180000  # 2 days + 2 hours
        },
    )

    TaskBase = celery.Task

    class ContextTask(TaskBase):
        abstract = True

        def __call__(self, *args, **kwargs):
            # If request context is already present then the celery task is called
            # sychronously in a request, so no need to generate a new app context
            if has_request_context():
                return TaskBase.__call__(self, *args, **kwargs)
            # Otherwise in worker, we create the context and run
            with app.app_context():
                return TaskBase.__call__(self, *args, **kwargs)

    celery.Task = ContextTask
    return celery


def make_limiter(app):
    def limiter_key_func():
        from flask_login import current_user

        if hasattr(current_user, "id"):
            return current_user.id
        return get_remote_address()

    limiter = Limiter(
        app,
        key_func=limiter_key_func,
        default_limits=["60 per minute"],
        default_limits_per_method=True,
    )
    limiter.enabled = QuerybookSettings.PRODUCTION
    for handler in app.logger.handlers:
        limiter.logger.addHandler(handler)

    @app.after_request
    def limiter_add_headers(response):
        if limiter.enabled and limiter.current_limit and limiter.current_limit.breached:
            response.headers["flask-limit-amount"] = limiter.current_limit.limit.amount
            response.headers["flask-limit-key"] = limiter.current_limit.key
            response.headers["flask-limit-reset-at"] = limiter.current_limit.reset_at
            response.headers[
                "flask-limit-window-size"
            ] = limiter.current_limit.limit.get_expiry()
        return response

    return limiter


def make_socketio(app):
    socketio = SocketIO(
        app,
        path="-/socket.io",
        message_queue=QuerybookSettings.REDIS_URL,
        json=flask_json,
        cors_allowed_origins="*",
    )
    return socketio


def make_blue_print(app, limiter):
    # Have flask automatically return the files within the build, so that it gzips them
    # and handles its 200/304 logic.
    blueprint = Blueprint(
        "static_build_files",
        __name__,
        static_folder=WEBAPP_DIR_PATH,
        static_url_path=BUILD_PATH,
    )
    app.register_blueprint(blueprint)
    limiter.exempt(blueprint)
    return blueprint


validate_db()
flask_app = make_flask_app()
limiter = make_limiter(flask_app)
make_blue_print(flask_app, limiter)
cache = make_cache(flask_app)
celery = make_celery(flask_app)
socketio = make_socketio(flask_app)
