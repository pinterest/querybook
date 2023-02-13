import datetime
import functools
import json
import traceback
import socket

import flask
from flask_login import current_user
from werkzeug.exceptions import Forbidden, NotFound

from app.flask_app import flask_app, limiter
from app.db import get_session
from const.datasources import (
    DS_PATH,
    OK_STATUS_CODE,
    UNAUTHORIZED_STATUS_CODE,
    INVALID_SEMANTIC_STATUS_CODE,
    ACCESS_RESTRICTED_STATUS_CODE,
    UNKNOWN_CLIENT_ERROR_STATUS_CODE,
    UNKNOWN_SERVER_ERROR_STATUS_CODE,
)
from lib.logger import get_logger
from logic.impression import create_impression
from lib.event_logger import event_logger

LOG = get_logger(__file__)
_host = socket.gethostname()


# Raise this exception if you want to include
# a custom message. (Since the "error" property
# was previously used as the stacktrace).
class RequestException(Exception):
    def __init__(self, message, status_code=None):
        super(RequestException, self).__init__(message)
        self.status_code = status_code


_epoch = datetime.datetime.utcfromtimestamp(0)


def DATE_MILLISECONDS(dt):
    """Return miliseconds for the given date"""
    if isinstance(dt, datetime.date):
        dt = datetime.datetime.combine(dt, datetime.datetime.min.time())
    delta = dt - _epoch
    return delta.total_seconds() * 1000.0


def register(
    url, methods=None, require_auth=True, custom_response=False, api_logging=True
):
    """Register an endpoint to be a data source."""

    def wrapper(fn):
        @flask_app.route(r"%s%s" % (DS_PATH, url), methods=methods)
        @functools.wraps(fn)
        def handler(**kwargs):
            if require_auth and not current_user.is_authenticated:
                flask.abort(UNAUTHORIZED_STATUS_CODE, description="Login required.")

            params = {}
            if flask.request.method == "GET":
                params = json.loads(flask.request.args.get("params", "{}"))
            elif flask.request.is_json:
                params = flask.request.json

            status = OK_STATUS_CODE
            try:
                kwargs.update(params)

                # api event logging. Ignore admin api endpoints
                if api_logging and not url.startswith("/admin"):
                    event_logger.log_api_request(
                        method=flask.request.method,
                        route=url,
                        params=kwargs,
                    )

                results = fn(**kwargs)

                if not custom_response:
                    if not isinstance(results, dict) or "data" not in results:
                        results = {"data": results, "host": _host}
                    else:
                        results["host"] = _host
            except (Forbidden, NotFound) as e:
                status = e.code
                results = {"host": _host, "error": e.description}
            except RequestException as e:
                status = e.status_code or UNKNOWN_CLIENT_ERROR_STATUS_CODE
                results = {"host": _host, "error": str(e), "request_exception": True}
            except Exception as e:
                LOG.error(e, exc_info=True)
                status = UNKNOWN_SERVER_ERROR_STATUS_CODE
                results = {
                    "host": _host,
                    "error": str(e),
                    "traceback": traceback.format_exc(),
                }
            finally:
                if status != OK_STATUS_CODE and "database_session" in flask.g:
                    flask.g.database_session.rollback()
            if custom_response:
                return results
            else:
                resp = flask.make_response(flask.jsonify(results), status)
                resp.headers["Content-Type"] = "application/json"
                return resp

        handler.__raw__ = fn
        return handler

    return wrapper


def with_impression(
    item_id_name,
    item_type,
):
    def wrapper(fn):
        @functools.wraps(fn)
        def handler(*args, **kwargs):
            result = fn(*args, **kwargs)
            try:
                # since we only do impression for GET and we should have GET something
                if result is not None and item_id_name in kwargs:
                    item_id = kwargs[item_id_name]
                    create_impression(item_id, item_type, current_user.id)
            except Exception as e:
                LOG.error(e, exc_info=True)
            finally:
                return result

        handler.__raw__ = fn
        return handler

    return wrapper


def admin_only(fn):
    """Wrapped function can only be called if the caller is an admin"""
    """Admin end points also rate limit exempt"""

    @limiter.exempt
    @functools.wraps(fn)
    def handler(*args, **kwargs):
        if current_user.is_authenticated and current_user.is_admin:
            return fn(*args, **kwargs)
        else:
            flask.abort(ACCESS_RESTRICTED_STATUS_CODE)

    handler.__raw__ = fn
    return handler


def api_assert(
    value, message="Assertion has failed", status_code=INVALID_SEMANTIC_STATUS_CODE
):
    if not value:
        abort_request(status_code, message)


def abort_request(
    status_code=UNKNOWN_CLIENT_ERROR_STATUS_CODE,
    message=None,
):
    raise RequestException(message, status_code)


@flask_app.teardown_request
def teardown_database_session(error):
    """Clean up the db connection at the end of request"""
    database_session = flask.g.pop("database_session", None)
    if database_session is not None:
        get_session().remove()
