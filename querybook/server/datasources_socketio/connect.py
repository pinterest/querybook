from flask_login import current_user
from flask_socketio import ConnectionRefusedError

from const.data_doc import DATA_DOC_NAMESPACE
from const.query_execution import QUERY_EXECUTION_NAMESPACE

from .helper import register_socket


def on_connect():
    if not current_user.is_authenticated:
        raise ConnectionRefusedError("User is not logged in, please refresh the page.")


@register_socket("connect", namespace=QUERY_EXECUTION_NAMESPACE)
def connect_query_execution(auth):
    on_connect()


@register_socket("connect", namespace=DATA_DOC_NAMESPACE)
def connect_datadoc(auth):
    on_connect()
