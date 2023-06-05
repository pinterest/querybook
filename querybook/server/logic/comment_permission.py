from flask_login import current_user
from querybook.server.app.datasource import api_assert
from querybook.server.app.db import with_session
from querybook.server.const.datasources import (
    RESOURCE_NOT_FOUND_STATUS_CODE,
    UNAUTHORIZED_STATUS_CODE,
)

from logic import comment as logic


class CommentDoesNotExist(Exception):
    pass


@with_session
def assert_can_edit_and_delete(comment_id, session=None):
    try:
        comment = logic.get_comment_by_id(comment_id=comment_id, session=session)
        if comment is None:
            raise CommentDoesNotExist
        api_assert(
            comment.uid == current_user.id,
            "NOT_COMMENT_AUTHOR",
            UNAUTHORIZED_STATUS_CODE,
        )
    except CommentDoesNotExist:
        api_assert(False, "COMMENT_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
