from typing import Dict, List

from const.schedule import NotifyOn
from lib.export.all_exporters import get_exporter
from lib.notify.all_notifiers import get_notifier_class
from lib.form import validate_form


class InvalidScheduleException(Exception):
    pass


valid_schedule_config_keys = [
    "exports",
    "notifications",
    "disable_if_running_doc",
]
valid_export_config_keys = ["exporter_cell_id", "exporter_name", "exporter_params"]
valid_notification_keys = ["with", "on", "config"]
valid_notification_config_keys = ["to", "to_user"]


def validate_datadoc_schedule_config(schedule_config):
    try:
        validate_dict_keys(schedule_config, valid_schedule_config_keys)
        validate_notifications_config(schedule_config.get("notifications", []))
        validate_exporters_config(schedule_config.get("exports", []))
    except InvalidScheduleException as e:
        return False, str(e)
    return True, ""


def validate_dict_keys(d: Dict, allowed_keys: List):
    for key in d.keys():
        if key not in allowed_keys:
            raise InvalidScheduleException(f"Invalid field {key}")


def validate_notifications_config(notifications: List):
    if not notifications:
        return

    for notification in notifications:
        validate_dict_keys(notification, valid_notification_keys)
        validate_dict_keys(notification.get("config"), valid_notification_config_keys)

        # validate notify with
        notifier_name = notification.get("with", None)
        try:
            get_notifier_class(notifier_name)
        except ValueError:
            raise InvalidScheduleException(f"Invalid notifier {notifier_name}")

        # validate notify on
        if notification.get("on") not in [on.value for on in NotifyOn]:
            raise InvalidScheduleException(
                f"Invalid notify on {notification.get('on')}"
            )


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
