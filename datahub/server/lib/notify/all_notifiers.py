from lib.utils.plugin import import_plugin

ALL_PLUGIN_NOTIFIERS = import_plugin("notification_plugin", "ALL_PLUGIN_NOTIFIERS", [])

ALL_NOTIFIERS = ALL_PLUGIN_NOTIFIERS


def get_notifier_class(name: str):
    for notifier in ALL_PLUGIN_NOTIFIERS:
        if notifier.notifier_name == name:
            return notifier
    raise ValueError(f"Unknown notifier name {name}")
