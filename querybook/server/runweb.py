"""This file is for dev server only.
   DO NOT USE FOR PROD
"""

from gevent import monkey

monkey.patch_all()

from lib.patch import patch_all

patch_all()

import multiprocessing
import os
import shlex
import sys
import subprocess

import gevent.pywsgi
import gevent.socket

from app.server import flask_app


def main():
    host = "0.0.0.0"
    port = 5000
    if len(sys.argv) > 1:
        port = int(sys.argv[-1])

    debug = "--debug" in sys.argv
    run_webpack = "--webpack" in sys.argv

    webpack_process = None

    if debug:
        from flask_compress import Compress

        Compress(flask_app)

        # We are on the parent process
        if os.environ.get("WERKZEUG_RUN_MAIN") != "true":
            if run_webpack:
                webpack_process = multiprocessing.Process(target=webpack)
                webpack_process.start()
            else:
                print("Webpack is disabled. html/js/css will not be built.")
                print("To make web files: python runweb.py --debug --webpack port")
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
        shlex.split("./node_modules/.bin/webpack --progress --color --watch"),
        stdout=subprocess.PIPE,
    )
    while True:
        output = webpack_subprocess.stdout.readline()
        if output == "" and webpack_subprocess.poll() is not None:
            break
        if output:
            sys.stdout.write(output.decode("utf-8"))


def terminate_process_if_live(process):
    if process is not None and process.is_alive():
        process.terminate()


if __name__ == "__main__":
    main()
