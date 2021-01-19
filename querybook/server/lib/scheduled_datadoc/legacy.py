from typing import Dict

LEGACY_KEYS = ["exporter_cell_id", "exporter_name", "exporter_params"]


def set_key_if_exists(to_dict: Dict, from_dict: Dict, key: str):
    if key in from_dict:
        to_dict[key] = from_dict[key]


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
