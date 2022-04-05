from lib.utils.import_helper import import_module_with_default
from .notifier.email_notifier import EmailNotifier

ALL_PLUGIN_NOTIFIERS = import_module_with_default(
    "notifier_plugin",
    "ALL_PLUGIN_NOTIFIERS",
    default=[
        EmailNotifier(),
    ],
)

ALL_NOTIFIERS = ALL_PLUGIN_NOTIFIERS

DEFAULT_NOTIFIER = ALL_NOTIFIERS[0].notifier_name if ALL_NOTIFIERS else None


def get_notifier_class(name: str):
    for notifier in ALL_PLUGIN_NOTIFIERS:
        if notifier.notifier_name == name:
            return notifier
    raise ValueError(f"Unknown notifier name {name}")
