from datetime import datetime, timedelta
from enum import Enum
from typing import Optional
from app.flask_app import celery

from models.schedule import (
    TaskSchedule,
)
from app.db import with_session
from env import QuerybookSettings
from const.schedule import TaskRunStatus
from const.impression import ImpressionItemType
from lib.notify.utils import notify_user
from lib.scheduled_datadoc.legacy import convert_if_legacy_datadoc_schedule
from logic.schedule import (
    DATADOC_SCHEDULE_PREFIX,
    update_task_schedule,
    with_task_logging,
    get_task_run_records,
    delete_task_schedule,
)
from logic.datadoc import get_data_doc_by_id
from logic.user import get_user_by_id
from logic.impression import get_viewers_count_by_item_after_date
from lib.logger import get_logger


logger = get_logger(__name__)


class DisablePolicy(Enum):
    INACTIVE_OWNER = "INACTIVE_OWNER"
    NO_IMPRESSION_FOR_N_DAYS = "NO_IMPRESSION_FOR_N_DAYS"
    FAILED_FOR_N_RUNS = "FAILED_FOR_N_RUNS"


DISABLE_POLICY_TO_REASON = {
    DisablePolicy.INACTIVE_OWNER.value: "Disabled due to inactive owner",
    DisablePolicy.NO_IMPRESSION_FOR_N_DAYS.value: "Disabled due to no impression for {} days",
    DisablePolicy.FAILED_FOR_N_RUNS.value: "Disabled due to failing for the past {} runs",
}


def disable_policy_to_reason(policy: DisablePolicy, n_runs: int, n_days: int):
    reason = DISABLE_POLICY_TO_REASON[policy.value]
    if policy == DisablePolicy.NO_IMPRESSION_FOR_N_DAYS:
        reason = reason.format(n_days)
    elif policy == DisablePolicy.FAILED_FOR_N_RUNS:
        reason = reason.format(n_runs)
    return reason


@with_session
def get_scheduled_datadoc_tasks(session=None):
    tasks = (
        session.query(TaskSchedule)
        .filter(
            TaskSchedule.enabled.is_(True),
            TaskSchedule.name.like(DATADOC_SCHEDULE_PREFIX + "%"),
            TaskSchedule.task_type == "user",
        )
        .all()
    )
    task_dicts = []
    for task in tasks:
        task_dict = task.to_dict()
        task_dict["kwargs"] = convert_if_legacy_datadoc_schedule(task_dict["kwargs"])
        task_dicts.append(task_dict)
    return task_dicts


def check_if_doc_exists(task_dict, session):
    doc_id = task_dict["kwargs"]["doc_id"]
    doc = get_data_doc_by_id(doc_id, session=session)
    return doc is not None


def get_task_owner(task_dict, session):
    doc_id = task_dict["kwargs"]["doc_id"]
    task_uid = task_dict["kwargs"].get("user_id")

    if not task_uid:
        doc = get_data_doc_by_id(doc_id, session=session)
        task_uid = doc.owner_uid

    task_owner = get_user_by_id(task_uid, session=session)
    return task_owner


def check_task_inactive_owner(task_dict, session):
    task_owner = get_task_owner(task_dict, session=session)
    return task_owner.deleted


def check_task_failed_for_n_runs(task_dict, n_runs, session):
    task_logs = get_task_run_records(task_dict["name"], limit=n_runs, session=session)

    if len(task_logs) == n_runs and all(
        log.status != TaskRunStatus.SUCCESS for log in task_logs
    ):
        return True

    return False


def check_task_no_impression_for_n_days(task_dict, n_days, session):
    doc_id = task_dict["kwargs"]["doc_id"]
    num_impressions = get_viewers_count_by_item_after_date(
        ImpressionItemType.DATA_DOC,
        doc_id,
        (datetime.now() + timedelta(-n_days)).date(),
        session=session,
    )
    return num_impressions == 0


def notify_schedule_owners(notifier: str, tasks_to_disable: list, session):
    for task_to_disable in tasks_to_disable:
        doc_id = task_to_disable["doc_id"]
        doc = get_data_doc_by_id(doc_id, session=session)

        # Findout who should be notified of this change
        # it must be someone who can take action on the doc
        possible_owners = (
            [task_to_disable["task_owner_uid"], doc.owner_uid]
            if task_to_disable["task_owner_uid"]
            else [doc.owner_uid]
        ) + [editor.uid for editor in doc.editors if editor.write]
        doc_owner = None

        for possible_owner in possible_owners:
            user = get_user_by_id(possible_owner, session=session)
            if not user.deleted:
                doc_owner = possible_owner
                break

        if doc_owner is None:
            continue

        notify_user(
            doc_owner,
            template_name="schedule_disabled_notification",
            template_params={
                "data_doc_title": doc.title or "Untitled",
                "doc_url": f"{QuerybookSettings.PUBLIC_URL}/{doc.environment.name}/datadoc/{doc_id}/",
                "disabled_reason": task_to_disable["reason"],
            },
            notifier_name=notifier,
            session=session,
        )


@with_session
def disable_deactivated_scheduled_docs(
    dry_run: bool = False,
    notifier: Optional[str] = None,
    disable_if_inactive_owner: bool = True,
    disable_if_failed_for_n_runs: Optional[int] = 5,
    disable_if_no_impression_for_n_days: Optional[int] = 30,
    session=None,
):
    tasks_to_disable: list[dict] = []
    tasks_to_delete: list[int] = []
    task_dicts = get_scheduled_datadoc_tasks(session=session)
    for task_dict in task_dicts:
        should_disable = None

        if not check_if_doc_exists(task_dict, session=session):
            tasks_to_delete.append(task_dict["id"])
            continue

        if disable_if_inactive_owner and check_task_inactive_owner(task_dict, session):
            should_disable = DisablePolicy.INACTIVE_OWNER

        if (
            should_disable is None
            and disable_if_failed_for_n_runs is not None
            and check_task_failed_for_n_runs(
                task_dict, disable_if_failed_for_n_runs, session
            )
        ):
            should_disable = DisablePolicy.FAILED_FOR_N_RUNS

        if (
            not should_disable
            and disable_if_no_impression_for_n_days is not None
            and check_task_no_impression_for_n_days(
                task_dict, disable_if_no_impression_for_n_days, session
            )
        ):
            should_disable = DisablePolicy.NO_IMPRESSION_FOR_N_DAYS

        if should_disable is not None:
            tasks_to_disable.append(
                {
                    "doc_id": task_dict["kwargs"]["doc_id"],
                    "task_id": task_dict["id"],
                    "reason": disable_policy_to_reason(
                        should_disable,
                        disable_if_failed_for_n_runs,
                        disable_if_no_impression_for_n_days,
                    ),
                    "task_owner_uid": task_dict["kwargs"].get("user_id"),
                }
            )

    if not dry_run:
        for task_id in tasks_to_delete:
            delete_task_schedule(task_id, commit=False, session=session)

        for task_to_disable in tasks_to_disable:
            update_task_schedule(
                task_to_disable["task_id"], commit=False, session=session, enabled=False
            )
        session.commit()

        if notifier:
            notify_schedule_owners(notifier, tasks_to_disable, session=session)

    return tasks_to_disable


@celery.task(bind=True)
@with_task_logging()
def disable_scheduled_docs(self):
    tasks_to_disable = disable_deactivated_scheduled_docs()
    if len(tasks_to_disable) == 0:
        logger.info("No scheduled docs disabled.")
    else:
        logger.info(
            f"{len(tasks_to_disable)} scheduled docs were disabled, see: {tasks_to_disable}."
        )
