from typing import Dict
from logic import (
    user as user_logic,
)

LEGACY_KEYS = ["exporter_cell_id", "exporter_name", "exporter_params"]


def set_key_if_exists(to_dict: Dict, from_dict: Dict, key: str):
    if key in from_dict:
        to_dict[key] = from_dict[key]


def is_legacy_notification_format(schedule_config):
    return (
        schedule_config.get("notify_with")
        and schedule_config.get("notify_on")
        and not schedule_config.get("notifications")
    )


def convert_legacy_notification_to_new_format(schedule_config):
    user = user_logic.get_user_by_id(schedule_config.get("user_id"))
    notify_to = (
        user.email if schedule_config.get("notify_with") == "email" else user.username
    )
    return [
        {
            "on": schedule_config.get("notify_on"),
            "with": schedule_config.get("notify_with"),
            "config": {"to": [notify_to]},
        }
    ]


def convert_if_legacy_datadoc_schedule(schedule_config: Dict) -> Dict:
    """Previously, the format of the datadoc schedule can only
       support a single export. Now the exports config is in an
       array to support multiple export options. This function
       ensures that the config used is always converted to
       the one with multi-export.

    Args:
        schedule_config (Dict): Can be legacy config or no legacy

    Returns:
        Dict: Up to date config
    """

    is_legacy_config = any(
        key in schedule_config for key in LEGACY_KEYS
    ) or is_legacy_notification_format(schedule_config)
    if not is_legacy_config:
        return schedule_config

    exports = []
    if "exporter_cell_id" in schedule_config:
        export_config = {
            "exporter_cell_id": schedule_config["exporter_cell_id"],
            "exporter_name": schedule_config["exporter_name"],
        }
        set_key_if_exists(export_config, schedule_config, "exporter_params")
        exports.append(export_config)

    new_schedule_config = {
        "exports": exports,
        "doc_id": schedule_config["doc_id"],
        "user_id": schedule_config["user_id"],
    }
    set_key_if_exists(new_schedule_config, schedule_config, "notify_with")
    set_key_if_exists(new_schedule_config, schedule_config, "notify_on")

    if is_legacy_notification_format(new_schedule_config):
        new_schedule_config[
            "notifications"
        ] = convert_legacy_notification_to_new_format(new_schedule_config)

    return new_schedule_config
