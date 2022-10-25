from typing import Dict, List

from app.db import DBSession, with_session
from const.schedule import NotifyOn
from env import QuerybookSettings
from lib.notify.utils import notify_recipients
from logic.datadoc import get_data_doc_by_id


def notifiy_on_datadoc_complete(
    doc_id: int,
    is_success: bool,
    notifications: List[Dict],
    error_msg: str,
    export_urls: List[str],
):
    for notification in notifications:
        notify_with = notification.get("with")
        notify_on = notification.get("on")
        notify_to = notification.get("config", {}).get("to", [])

        if _should_notify(notify_with, notify_on, is_success):
            with DBSession() as session:
                notify_recipients(
                    recipients=notify_to,
                    template_name="datadoc_completion_notification",
                    template_params=_get_datadoc_notification_params(
                        doc_id, is_success, error_msg, export_urls, session=session
                    ),
                    notify_name=notify_with,
                )


def _should_notify(notify_with: str, notify_on: NotifyOn, is_success: bool):
    return bool(notify_with) and (
        notify_on == NotifyOn.ALL.value
        or (
            (notify_on == NotifyOn.ON_SUCCESS.value and is_success)
            or (notify_on == NotifyOn.ON_FAILURE.value and not is_success)
        )
    )


@with_session
def _get_datadoc_notification_params(
    doc_id: int, is_success: bool, error_msg: str, export_urls: List[str], session=None
):
    datadoc = get_data_doc_by_id(doc_id, session=session)
    doc_title = datadoc.title or "Untitled"
    env_name = datadoc.environment.name
    doc_url = f"{QuerybookSettings.PUBLIC_URL}/{env_name}/datadoc/{doc_id}/"

    return dict(
        is_success=is_success,
        doc_title=doc_title,
        doc_url=doc_url,
        doc_id=doc_id,
        export_urls=export_urls,
        error_msg=error_msg,
    )
