from flask import send_from_directory, g

from app import auth
from app.datasource import register, abort_request
from app.db import get_session
from app.flask_app import flask_app, limiter
from const.path import WEBAPP_PATH

import datasources
import datasources_socketio

auth.init_app(flask_app)
datasources
datasources_socketio


@flask_app.teardown_appcontext
def teardown_database_session(error):
    database_session = g.pop("database_session", None)

    if database_session is not None:
        get_session().remove()


@flask_app.errorhandler(Exception)
def handle_exception(e):
    database_session = g.get("database_session", None)
    if database_session:
        database_session.rollback()


@register("/<path:ignore>/")
@limiter.exempt
def datasource_four_oh_four(*args, **kwargs):
    abort_request(404)


@flask_app.route("/ping/")
@limiter.exempt
def get_health_check():
    """This is a health check endpoint"""
    return "pong"


@flask_app.route("/")
@flask_app.route("/<path:ignore>/")
@limiter.exempt
def main(ignore=None):
    return send_from_directory(WEBAPP_PATH, "index.html")
