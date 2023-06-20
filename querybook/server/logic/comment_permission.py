from flask_login import current_user
from app.datasource import api_assert
from app.db import with_session
from const.datasources import (
    RESOURCE_NOT_FOUND_STATUS_CODE,
    UNAUTHORIZED_STATUS_CODE,
)

from logic import comment as logic
from logic.datadoc_permission import assert_can_read
from models.datadoc import DataDocDataCell


class CommentDoesNotExist(Exception):
    pass


@with_session
def assert_can_read_datadoc(data_cell_id, session=None):
    data_cell = (
        session.query(DataDocDataCell)
        .filter(DataDocDataCell.data_cell_id == data_cell_id)
        .first()
    )
    assert_can_read(data_cell.data_doc_id)


@with_session
def assert_can_edit_and_delete(comment_id, session=None):
    try:
        comment = logic.get_comment_dict_by_id(comment_id=comment_id, session=session)
        if comment is None:
            raise CommentDoesNotExist
        api_assert(
            comment["created_by"] == current_user.id,
            "NOT_COMMENT_AUTHOR",
            UNAUTHORIZED_STATUS_CODE,
        )
    except CommentDoesNotExist:
        api_assert(False, "COMMENT_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
