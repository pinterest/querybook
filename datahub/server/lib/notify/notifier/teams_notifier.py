from lib.notify.base_notifier import BaseNotifier
import requests


class TeamsNotifier(BaseNotifier):
    def __init__(
        self, tenent, client_id, client_secret, group_id, channel_id, username, password
    ):
        self.tenent = tenent
        self.client_id = client_id
        self.client_secret = client_secret
        self.group_id = group_id
        self.channel_id = channel_id
        self.username = username
        self.password = password

    @property
    def notifier_name(self):
        return "teams"

    @property
    def notifier_format(self):
        return "html"

    def notify(self, user, message):
        auth_endpoint = (
            f"https://login.microsoftonline.com/{self.tenent}/oauth2/v2.0/token"
        )
        params = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "ChannelMessage.Send Group.ReadWrite.All",
            "username": self.username,
            "password": self.password,
            "grant_type": "password",
        }
        token = requests.post(auth_endpoint, params).json()
        endpoint = f"https://graph.microsoft.com/v1.0/teams/{self.group_id}/channels/{self.channel_id}/messages"
        text = self._convert_markdown(message)
        data = {"body": {"contentType": "html", "content": text}}
        headers = {"Authorization": "Bearer {}".format(token["access_token"])}
        requests.post(endpoint, json=data, headers=headers)
