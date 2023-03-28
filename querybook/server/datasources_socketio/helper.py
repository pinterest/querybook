import functools
import flask
from flask_login import current_user
from flask_socketio import disconnect

from app.flask_app import socketio
from lib.event_logger import event_logger
from lib.logger import get_logger
from lib.stats_logger import stats_logger, WS_CONNECTIONS_COUNTER

LOG = get_logger(__file__)


def register_socket(url, namespace=None, websocket_logging=True):
    def wrapper(fn):
        @socketio.on(url, namespace=namespace)
        @functools.wraps(fn)
        def handler(*args, **kwargs):
            if not current_user.is_authenticated:
                LOG.error("Unauthorized websocket access")
                disconnect()
                # decrement ws connections counter on disconnect
                stats_logger.decr(WS_CONNECTIONS_COUNTER)
            else:
                try:
                    if websocket_logging:
                        event_logger.log_websocket_event(
                            route=namespace + "/" + url,
                            args=args,
                            kwargs=kwargs,
                        )
                    fn(*args, **kwargs)
                except Exception as e:
                    LOG.error(e, exc_info=True)
                    socketio.emit(
                        "error",
                        str(e),
                        namespace=namespace,
                        room=flask.request.sid,
                    )

                # decrement ws connections counter on disconnect
                if url == "disconnect":
                    stats_logger.decr(WS_CONNECTIONS_COUNTER)

        handler.__raw__ = fn
        return handler

    return wrapper
