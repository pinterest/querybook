import sys

from celery import Celery
from flask import Flask, Blueprint, json as flask_json
from flask_socketio import SocketIO
from flask_login import current_user
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_caching import Cache


from const.path import BUILD_PATH, STATIC_PATH, WEBAPP_PATH
from env import DataHubSettings
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
                f"Invalid Database connection string {DataHubSettings.DATABASE_CONN}"
            )


def make_flask_app():
    app = Flask(__name__, static_folder=STATIC_PATH)
    app.json_encoder = JSONEncoder
    app.secret_key = DataHubSettings.FLASK_SECRET_KEY

    return app


# TODO: generlize before opensource
def make_cache(app):
    return Cache(
        app,
        config={
            "CACHE_TYPE": "memcached",
            "CACHE_KEY_PREFIX": "datahub:",
            "CACHE_MEMCACHED_SERVERS": ["localhost:22000"],
        },
    )


def make_celery(app):
    celery = Celery(
        app.import_name,
        backend=DataHubSettings.REDIS_URL,
        broker=DataHubSettings.REDIS_URL,
    )

    celery.conf.update(
        CELERYD_PREFETCH_MULTIPLIER=1,
        CELERYD_MAX_TASKS_PER_CHILD=1,
        CELERY_TRACK_STARTED=True,
        CELERYD_TASK_SOFT_TIME_LIMIT=172800,
        BROKER_TRANSPORT_OPTIONS={
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
        default_limits=["1000 per day", "30 per minute"],
    )
    limiter.enabled = DataHubSettings.PRODUCTION
    for handler in app.logger.handlers:
        limiter.logger.addHandler(handler)
    return limiter


def make_socketio(app):
    socketio = SocketIO(
        app,
        path="-/socket.io",
        message_queue=DataHubSettings.REDIS_URL,
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
        static_folder=WEBAPP_PATH,
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
