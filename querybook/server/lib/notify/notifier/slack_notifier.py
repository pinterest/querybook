import requests
from env import QuerybookSettings
from lib.notify.base_notifier import BaseNotifier


class SlackNotifier(BaseNotifier):
    def __init__(self, token=None):
        self.token = (
            token if token is not None else QuerybookSettings.QUERYBOOK_SLACK_TOKEN
        )

    @property
    def notifier_name(self):
        return "slack"

    @property
    def notifier_format(self):
        return "plaintext"

    def notify(self, user, message):
        to = f"@{user.username}"
        url = "https://slack.com/api/chat.postMessage"
        headers = {"Authorization": "Bearer {}".format(self.token)}
        text = self._convert_markdown(message)
        data = {
            "text": text,
            "channel": to,
        }
        requests.post(url, json=data, headers=headers, timeout=30)
