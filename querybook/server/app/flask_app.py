import sys
from datetime import timedelta

from celery import Celery
from flask import Flask, Blueprint, json as flask_json, has_request_context
from flask_socketio import SocketIO
from flask_login import current_user
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

    return app


def make_cache(app):
    return Cache(app, config=QuerybookSettings.FLASK_CACHE_CONFIG,)


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
    limiter = Limiter(
        app,
        key_func=lambda: current_user.id
        if hasattr(current_user, "id")
        else get_remote_address(),
        default_limits=["30 per minute"],
    )
    limiter.enabled = QuerybookSettings.PRODUCTION
    for handler in app.logger.handlers:
        limiter.logger.addHandler(handler)
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
    # Have flask automatically return the files within build, so that it gzips them
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
