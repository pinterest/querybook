from lib.notify.notifier.email_notifier import EmailNotifier
from lib.notify.notifier.slack_notifier import SlackNotifier

ALL_PLUGIN_NOTIFIERS = [
    EmailNotifier(),
    SlackNotifier(),
]