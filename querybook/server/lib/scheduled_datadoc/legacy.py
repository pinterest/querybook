from typing import Dict

LEGACY_KEYS = ["exporter_cell_id", "exporter_name", "exporter_params"]


def set_key_if_exists(to_dict: Dict, from_dict: Dict, key: str):
    if key in from_dict:
        to_dict[key] = from_dict[key]


def convert_if_legacy_datadoc_schedule_v0(schedule_config: Dict) -> Dict:
    """Convert a legacy v0 datadoc schedule config to the v1 version.

    For v0, the format of the datadoc schedule can only
    support a single export.

    For v1, the exports config is in an
    array to support multiple export options. This function
    ensures that the config used is always converted to
    the one with multi-export.

    Args:
        schedule_config (Dict): Can be legacy config or no legacy

    Returns:
        Dict: Up to date config
    """

    is_legacy_config = any(key in schedule_config for key in LEGACY_KEYS)
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

    return new_schedule_config


def convert_if_legacy_datadoc_schedule_v1(schedule_config: Dict) -> Dict:
    """Convert a legacy v1 datadoc schedule config to the latest version.

    For v1, the datadoc schedule only supported to send notification to the
    user who created or updated the schedule.
    For the latest version, user can provide a list of recipients to send
    notificaiton to. e.g.
        {
            "doc_id": 3,
            "exports": [],
            "user_id": 1,
            "notifications": [
                {
                    "on": 0,
                    "with": "slack",
                    "config": {
                        "to": [
                            "@some-username",
                            "#some-slack-channel-name"
                        ],
                        "to_user": [1]
                    }
                },
                {
                    "on": 0,
                    "with": "email",
                    "config": {
                        "to": [
                            "a@pinterest.com",
                            "b@pinterest.com"
                        ],
                        "to_user": [1]
                    }
                }
            ]
        }

    Args:
        schedule_config (Dict): legacy schedule config

    Returns:
        Dict: new schedule config
    """

    # check if it's already in new notification format
    if schedule_config.get("notifications") is not None:
        return schedule_config

    schedule_config["notifications"] = [
        {
            "on": schedule_config.get("notify_on"),
            "with": schedule_config.get("notify_with"),
            "config": {"to_user": [schedule_config.get("user_id")]},
        }
    ]
    schedule_config.pop("notify_on", None)
    schedule_config.pop("notify_with", None)

    return schedule_config


def convert_if_legacy_datadoc_schedule(schedule_config: Dict) -> Dict:
    """Convert a legacy datadoc schedule config to the latest version.

    Args:
        schedule_config (Dict): legacy schedule config

    Returns:
        Dict: new schedule config
    """
    new_schedule_config = convert_if_legacy_datadoc_schedule_v0(schedule_config)
    new_schedule_config = convert_if_legacy_datadoc_schedule_v1(new_schedule_config)
    return new_schedule_config
