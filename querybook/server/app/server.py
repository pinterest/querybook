import os
from flask import send_file, abort

from app import auth
from app.datasource import register, abort_request
from app.flask_app import flask_app, limiter
from const.path import WEBAPP_INDEX_PATH


import datasources
import datasources_socketio

auth.init_app(flask_app)
datasources
datasources_socketio


@register("/<path:ignore>")
@limiter.exempt
def datasource_four_oh_four(*args, **kwargs):
    abort_request(404)


@flask_app.route("/ping/")
@limiter.exempt
def get_health_check():
    """This is a health check endpoint"""
    if os.path.exists("/tmp/querybook/deploying"):
        abort(503)
    return "pong"


@flask_app.route("/")
@flask_app.route("/<path:ignore>")
@limiter.exempt
def main(ignore=None):
    return send_file(WEBAPP_INDEX_PATH, mimetype="text/html")
