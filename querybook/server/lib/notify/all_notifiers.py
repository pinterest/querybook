from env import QuerybookSettings

from lib.utils.import_helper import import_module_with_default
from .notifier.email_notifier import EmailNotifier
from .notifier.noop_notifier import NoopNotifier
from .notifier.slack_notifier import SlackNotifier

default_notifiers = []

# Auto-load the EmailNotifier / SlackNotifier if configured
if QuerybookSettings.EMAILER_CONN and QuerybookSettings.QUERYBOOK_EMAIL_ADDRESS:
    default_notifiers.append(EmailNotifier())
if QuerybookSettings.QUERYBOOK_SLACK_TOKEN:
    default_notifiers.append(SlackNotifier())

# If no other notifiers auto-loaded, enable the NoopNotifier
if not default_notifiers:
    default_notifiers.append(NoopNotifier())

ALL_PLUGIN_NOTIFIERS = import_module_with_default(
    "notifier_plugin", "ALL_PLUGIN_NOTIFIERS", default=default_notifiers
)

ALL_NOTIFIERS = ALL_PLUGIN_NOTIFIERS

DEFAULT_NOTIFIER = ALL_NOTIFIERS[0].notifier_name if ALL_NOTIFIERS else None


def get_notifier_class(name: str):
    for notifier in ALL_PLUGIN_NOTIFIERS:
        if notifier.notifier_name == name:
            return notifier
    raise ValueError(f"Unknown notifier name {name}")
