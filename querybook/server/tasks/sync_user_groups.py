import traceback

from app.db import DBSession
from app.flask_app import celery
from lib.logger import get_logger
from lib.metastore import get_metastore_loader
from logic.schedule import with_task_logging
from logic.user import create_or_update_user_group

LOG = get_logger(__name__)


@celery.task(bind=True)
@with_task_logging()
def sync_user_groups(self, metastore_id):
    """To use this task, method `get_all_user_groups` needs to be implemented in the metastore loader."""
    with DBSession() as session:
        try:
            metastore_loader = get_metastore_loader(metastore_id, session=session)
            groups = metastore_loader.get_all_user_groups()
            for user_group in groups:
                create_or_update_user_group(user_group, commit=False, session=session)

            session.commit()
        except Exception:
            session.rollback()
            LOG.error(traceback.format_exc())
