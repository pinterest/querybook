import requests
from env import DataHubSettings
from lib.notify.base_notifier import BaseNotifier


class SlackNotifier(BaseNotifier):
    @property
    def notifier_name(self):
        return "slack"

    @property
    def notifier_format(self):
        return "plaintext"

    def notify(self, user, message):
        to = f"@{user.username}"
        token = DataHubSettings.DATAHUB_SLACK_TOKEN
        url = "https://slack.com/api/chat.postMessage"
        headers = {"Authorization": "Bearer {}".format(token)}
        text = self._convert_markdown(message)
        data = {
            "text": text,
            "channel": to,
        }
        requests.post(url, json=data, headers=headers, timeout=30)
