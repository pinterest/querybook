"""This file is for dev server only.
   DO NOT USE FOR PROD
"""

from gevent import monkey

monkey.patch_all()

from lib.patch import patch_all

patch_all()

import multiprocessing
import os
import time
import shlex
import sys
import subprocess

import gevent.pywsgi
import gevent.socket

from app.server import flask_app
from const.path import WEBAPP_INDEX_PATH
from lib.utils.console import print_welcome_message


def main():
    host = "0.0.0.0"
    port = 5000
    if len(sys.argv) > 1:
        port = int(sys.argv[-1])

    debug = "--debug" in sys.argv

    webpack_process = None

    if debug:
        from flask_compress import Compress

        Compress(flask_app)

        # We are on the parent process
        if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
            webpack_process = multiprocessing.Process(target=webpack)
            webpack_process.start()
    else:
        print("You are not running in debug mode, so files are not autoreloaded.")
        print("To run in debug mode: python runweb.py --debug port")

    try:
        socketio_server(host=host, port=port, debug=debug)
    finally:
        terminate_process_if_live(webpack_process)


def socketio_server(host="0.0.0.0", port=5000, debug=False):
    from app.flask_app import socketio

    gevent.socket.setdefaulttimeout(30000)
    print("Running Querybook(w/ socketio) in port: {}".format(port))
    socketio.run(flask_app, host=host, port=port, debug=debug)


def webpack():
    webpack_subprocess = subprocess.Popen(
        shlex.split("./node_modules/.bin/webpack --progress --colors --watch"),
        stdout=subprocess.PIPE,
    )
    webpack_completion_checker = multiprocessing.Process(
        target=check_if_webpack_is_complete
    )
    webpack_completion_checker.start()

    try:
        while True:
            output = webpack_subprocess.stdout.readline()
            if output == "" and webpack_subprocess.poll() is not None:
                break
            if output:
                sys.stdout.write(output.decode("utf-8"))
    finally:
        webpack_subprocess.terminate()
        terminate_process_if_live(webpack_completion_checker)


def check_if_webpack_is_complete():
    # Waiting for webpack to clear the existing build files
    time.sleep(5)
    # Poll until HTML files are ready
    while not os.path.exists(WEBAPP_INDEX_PATH):
        time.sleep(1)
    # Wait for webpack to output all the logs
    time.sleep(1)

    print_welcome_message()


def terminate_process_if_live(process):
    if process is not None and process.is_alive():
        process.terminate()


if __name__ == "__main__":
    main()
