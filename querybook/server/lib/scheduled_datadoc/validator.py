from typing import Dict, List
from lib.export.all_exporters import get_exporter
from lib.form import validate_form


class InvalidScheduleException(Exception):
    pass


valid_schedule_config_keys = ["notify_with", "notify_on", "exports"]
valid_export_config_keys = ["exporter_cell_id", "exporter_name", "exporter_params"]


def validate_datadoc_schedule_config(schedule_config):
    try:
        validate_dict_keys(schedule_config, valid_schedule_config_keys)
        validate_exporters_config(schedule_config.get("exports", []))
    except InvalidScheduleException as e:
        return False, str(e)
    return True, ""


def validate_dict_keys(d: Dict, allowed_keys: List):
    for key in d.keys():
        if key not in allowed_keys:
            raise InvalidScheduleException(f"Invalid field {key}")


def validate_exporters_config(export_configs: List):
    if not export_configs:
        return

    for export_config in export_configs:
        validate_dict_keys(export_config, valid_export_config_keys)

        if export_config.get("exporter_cell_id", None) is None:
            raise InvalidScheduleException("exporter_cell_id is required")

        exporter = _get_exporter(export_config)
        exporter_params = export_config.get("exporter_params", {})
        exporter_form = exporter.export_form
        if exporter_form is not None or exporter_params:
            valid, reason = validate_form(exporter_form, exporter_params)
            if not valid:
                raise InvalidScheduleException(
                    f"Invalid exporter params, reason: {reason}"
                )


def _get_exporter(export_config):
    exporter_name = export_config.get("exporter_name", None)
    try:
        return get_exporter(exporter_name)
    except ValueError:
        raise InvalidScheduleException(f"Invalid exporter {exporter_name}")
