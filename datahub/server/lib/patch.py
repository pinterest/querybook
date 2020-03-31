def monkey_patch_gevent_websocket():
    # HACK: remove once socketio starts gevent websocket properly
    """
        THIS IS A HACK
          Right now flask-socketio uses gevent websocket handler with
        gevent.pywsgi server. This is bad since we cannot configure
        logging for websocket handler. This monkey would revert the
        websocket handler logging logic (which uses logger instead of stderr)
        to the original gevent.pywsgi logging logic. Please REMOVE if
        either flask-socketio or geventwebsocket fix their code
    """
    from gevent.pywsgi import WSGIHandler
    from geventwebsocket import handler

    def log_request(self):
        WSGIHandler.log_request(self)

    handler.WebSocketHandler.log_request = log_request

    # import logging
    # import sys
    # # Monkey patch hack to fix WebSocketHandler.logger
    # logger = logging.getLogger('geventwebsocket.handler')  # I think you could use any name here
    # logger.setLevel(logging.DEBUG)
    # stream_handler = logging.StreamHandler(sys.stdout)
    # logger.addHandler(stream_handler)
    # handler.WebSocketHandler.logger = property(lambda self: logger)


def monkey_patch_disable_watchdog():
    """
        THIS IS A HACK
        Once Watchdog is installed, it gets used by Werkzeug as autoreloader
        but it would break since flask app is running with gevent
    """
    from werkzeug._reloader import reloader_loops

    reloader_loops["auto"] = reloader_loops["stat"]


def patch_all():
    monkey_patch_gevent_websocket()
    monkey_patch_disable_watchdog()
