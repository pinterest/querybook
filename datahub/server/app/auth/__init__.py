# Copyright 2019 Pinterest, Inc
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
from lib.utils.plugin import import_plugin
from flask import request
from flask_login import logout_user, current_user

from const.path import BUILD_PATH
from const.datasources import DS_PATH
from env import DataHubSettings


auth = None


def init_app(flask_app):
    load_auth()

    global auth
    auth.init_app(flask_app)

    @flask_app.before_request
    def check_auth():
        ignore_paths = ["/ping/"] + getattr(auth, "ignore_paths", [])

        if request.path in ignore_paths:
            return

        # API LOGIC and Static File are handled differently
        if request.path.startswith(DS_PATH) or request.path.startswith(BUILD_PATH):
            return
        if not current_user.is_authenticated:
            return auth.login(request)

    check_auth  # PYLINT :(


def load_auth():
    global auth
    auth = import_plugin(DataHubSettings.AUTH_BACKEND)


def logout():
    logout_user()
