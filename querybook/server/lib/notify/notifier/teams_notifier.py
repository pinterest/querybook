from lib.notify.base_notifier import BaseNotifier
import requests


class TeamsNotifier(BaseNotifier):
    def __init__(
        self,
        tenant_id: str,
        client_id: str,
        client_secret: str,
        group_id: str,
        channel_id: str,
        username: str,
        password: str,
    ):
        self.tenant_id = tenant_id  # Microsoft 365 tenant ID
        self.client_id = client_id  # Azure App Client ID
        self.client_secret = client_secret  # Azure App Client Secret
        self.group_id = group_id  # Azure Group ID
        self.channel_id = channel_id  # Teams Channel ID
        self.username = username  # Teams user username
        self.password = password  # Teams user password

    @property
    def notifier_name(self):
        return "teams"

    @property
    def notifier_format(self):
        return "html"

    def notify(self, user, message):
        auth_endpoint = (
            f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        )
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "ChannelMessage.Send Group.ReadWrite.All",
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
        }
        auth_response = requests.post(auth_endpoint, params)
        auth_response.raise_for_status()
        token = auth_response.json()["access_token"]
        notification_endpoint = f"https://graph.microsoft.com/v1.0/teams/{self.group_id}/channels/{self.channel_id}/messages"
        text = self._convert_markdown(message)
        data = {"body": {"contentType": "html", "content": text}}
        headers = {"Authorization": "Bearer {}".format(token)}
        requests.post(notification_endpoint, json=data, headers=headers)
