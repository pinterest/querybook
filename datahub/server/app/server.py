from flask import send_from_directory

from app.flask_app import flask_app, limiter
from const.path import WEBAPP_PATH
from app.datasource import register, abort_request

from app import auth

import datasources
import datasources_socketio

auth.init_app(flask_app)
datasources
datasources_socketio


@register("/<path:ignore>/")
@limiter.exempt
def datasource_four_oh_four(ignore=None):
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
