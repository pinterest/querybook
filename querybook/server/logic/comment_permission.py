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
from models.comment import DataCellComment, CommentReaction


@with_session
def assert_can_read_datadoc(data_cell_id, session=None):
    data_cell = (
        session.query(DataDocDataCell)
        .filter(DataDocDataCell.data_cell_id == data_cell_id)
        .first()
    )
    assert_can_read(data_cell.data_doc_id)


@with_session
def assert_can_read_comment(comment_id, session=None):
    """Check if the current user can read a comment by checking if it belongs to a datadoc."""
    comment = logic.get_comment_by_id(comment_id=comment_id, session=session)
    api_assert(comment is not None, "COMMENT_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)

    # Check if this comment belongs to a datadoc
    data_cell_comment = (
        session.query(DataCellComment)
        .filter(DataCellComment.comment_id == comment_id)
        .first()
    )

    if data_cell_comment:
        # This comment belongs to a datadoc - reuse existing permission check
        assert_can_read_datadoc(data_cell_comment.data_cell_id, session=session)

    # If it doesn't belong to a datadoc, it's a table comment - no permission check needed


@with_session
def assert_can_delete_reaction(reaction_id, session=None):
    """Check if the current user can delete a reaction (must be the reaction owner)."""
    reaction = session.query(CommentReaction).get(reaction_id)
    api_assert(reaction is not None, "REACTION_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)

    # Check if user is the owner of this reaction
    api_assert(
        reaction.created_by == current_user.id,
        "NOT_REACTION_OWNER",
        UNAUTHORIZED_STATUS_CODE,
    )


@with_session
def assert_can_edit_and_delete(comment_id, session=None):
    comment = logic.get_comment_by_id(comment_id=comment_id, session=session)
    api_assert(comment is not None, "COMMENT_DNE", RESOURCE_NOT_FOUND_STATUS_CODE)
    api_assert(
        comment.created_by == current_user.id,
        "NOT_COMMENT_AUTHOR",
        UNAUTHORIZED_STATUS_CODE,
    )
