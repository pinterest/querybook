from app.db import with_session
from env import QuerybookSettings
from lib.notify.utils import notify_user
from logic import (
    query_execution as qe_logic,
    user as user_logic,
    query_execution_permission as qe_perm_logic,
)


@with_session
def notifiy_on_execution_completion(query_execution_id, session=None):
    query_execution = qe_logic.get_query_execution_by_id(
        query_execution_id, session=session
    )

    notifications = query_execution.notifications
    if len(notifications):
        data_cell = next(iter(query_execution.cells), None)
        # TODO: this should be determined by the notification.user?
        # Come up with a more efficient way to determine env per user
        env_name = getattr(
            qe_perm_logic.get_default_user_environment_by_execution_id(
                execution_id=query_execution_id,
                uid=query_execution.uid,
                session=session,
            ),
            "name",
            None,
        )

        # If the query execution is not associated with any environment
        # then no notification can be done
        if not env_name:
            return

        for notification in notifications:
            uid = notification.user
            user = user_logic.get_user_by_id(uid, session=session)
            doc_id = None
            cell_id = None
            query_title = "Untitled"

            if data_cell is not None:
                cell_id = data_cell.id
                doc_id = data_cell.doc.id
                query_title = data_cell.meta.get("title", query_title)

            notify_user(
                user=user,
                template_name="query_completion_notification",
                template_params=dict(
                    query_execution=query_execution,
                    doc_id=doc_id,
                    cell_id=cell_id,
                    query_title=query_title,
                    public_url=QuerybookSettings.PUBLIC_URL,
                    env_name=env_name,
                ),
                session=session,
            )
