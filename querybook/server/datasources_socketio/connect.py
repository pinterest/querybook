from flask_login import current_user
from flask_socketio import ConnectionRefusedError

from app.flask_app import socketio
from const.data_doc import DATA_DOC_NAMESPACE
from const.query_execution import QUERY_EXECUTION_NAMESPACE
from lib.stats_logger import stats_logger, WS_CONNECTIONS_COUNTER


def connect():
    stats_logger.incr(WS_CONNECTIONS_COUNTER)
    if not current_user.is_authenticated:
        raise ConnectionRefusedError("User is not logged in, please refresh the page.")


socketio.on_event("connect", connect, namespace=DATA_DOC_NAMESPACE)
socketio.on_event("connect", connect, namespace=QUERY_EXECUTION_NAMESPACE)
