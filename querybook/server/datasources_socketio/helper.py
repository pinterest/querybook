import functools
import flask
from flask_login import current_user
from flask_socketio import disconnect

from app.flask_app import socketio
from lib.logger import get_logger

LOG = get_logger(__file__)


def register_socket(url, namespace=None):
    def wrapper(fn):
        @socketio.on(url, namespace=namespace)
        @functools.wraps(fn)
        def handler(*args, **kwargs):
            if not current_user.is_authenticated:
                LOG.error("Unauthorized websocket access")
                disconnect()
            else:
                try:
                    fn(*args, **kwargs)
                except Exception as e:
                    LOG.error(e, exc_info=True)
                    socketio.emit(
                        "error",
                        str(e),
                        namespace=namespace,
                        broadcast=False,
                        room=flask.request.sid,
                    )

        handler.__raw__ = fn
        return handler

    return wrapper
