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
import ldap
from env import DataHubSettings

from .utils import DataHubLoginManager


class LDAPLoginManager(object):
    def __init__(self):
        self.login_manager = DataHubLoginManager()

    def init_app(self, flask_app):
        self.conn = ldap.initialize(DataHubSettings.LDAP_CONN)
        self.conn.set_option(ldap.OPT_REFERRALS, 0)
        self.conn.simple_bind_s(
            DataHubSettings.LDAP_LOGIN, DataHubSettings.LDAP_PASSWORD
        )

    def login(self, request):
        self.conn.search_s(DataHubSettings.LDAP_DOMAIN, ldap.SCOPE_SUBTREE)


login_manager = LDAPLoginManager()

ignore_paths = []


def init_app(app):
    login_manager.init_app(app)


def login(request):
    return login_manager.login(request)
