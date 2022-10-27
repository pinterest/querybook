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
    def notifier_help(self) -> str:
        return "Recipient could be a Querybook user or a Slack user(starts with @) or channel(starts with #)"

    @property
    def notifier_format(self):
        return "plaintext"

    def notify_recipients(self, recipients, message):
        """Send message to a list of slack users or channels.

        Args:
            recipients (list[str]): list of Slack user(starts with @) or channel(starts with #) names
            message (str): messge to be sent
        """
        url = "https://slack.com/api/chat.postMessage"
        headers = {"Authorization": "Bearer {}".format(self.token)}
        for recipient in recipients:
            text = self._convert_markdown(message)
            data = {
                "text": text,
                "channel": recipient,
            }
            requests.post(url, json=data, headers=headers, timeout=30)

    def notify(self, user, message):
        self.notify_recipients(recipients=[f"@{user.username}"], message=message)
