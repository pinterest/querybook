from typing import List, Optional, Tuple, Union
from app.db import with_session
from models import UserGroupMember, User, DataDocEditor, BoardEditor
from sqlalchemy import func, select
from sqlalchemy.orm import Session


@with_session
def get_all_groups_and_group_members_with_access(
    doc_or_board_id: int,
    editor_type: Union[DataDocEditor, BoardEditor],
    uid: Optional[int] = None,
    session: Optional[Session] = None,
) -> List[Tuple[int, int, bool, bool]]:
    """
    Get all groups and group members with access to a DataDoc or Board.

    Args:
        doc_or_board_id: The ID of the DataDoc or Board.
        editor_type: The type of editor (DataDocEditor or BoardEditor).
        uid: The ID of the user to filter by (optional)
        session: The database session to use.

    Returns:
        A list of tuples containing the editor ID, the group or user ID, and the most permissive read and write permissions.
        Editors with inherited permissions have their ID set to None.
    """
    topq = session.query(
        editor_type.id, editor_type.uid, editor_type.read, editor_type.write
    ).select_from(editor_type)

    if editor_type == DataDocEditor:
        topq = topq.filter(editor_type.data_doc_id == doc_or_board_id)
    elif editor_type == BoardEditor:
        topq = topq.filter(editor_type.board_id == doc_or_board_id)

    topq = topq.cte("cte", recursive=True)

    bottomq = (
        select([None, UserGroupMember.uid, topq.c.read, topq.c.write])
        .select_from(topq)
        .join(User, topq.c.uid == User.id)
        .join(UserGroupMember, UserGroupMember.gid == User.id)
        .filter(User.is_group)
    )

    recursive_q = topq.union(bottomq)

    editors = recursive_q.alias()

    q = select(
        [
            func.max(editors.c.id),
            editors.c.uid,
            func.max(editors.c.read),
            func.max(editors.c.write),
        ]
    ).group_by(editors.c.uid)

    # Optionally filter by uid to get only the permissions for a specific user
    if uid is not None:
        q = q.filter(editors.c.uid == uid)

    return session.query(q.subquery()).all()


@with_session
def user_has_permission(
    doc_or_board_id, permission_level, editor_type, uid, session=None
):

    if editor_type == BoardEditor:
        editor = (
            session.query(BoardEditor)
            .filter_by(uid=uid, board_id=doc_or_board_id)
            .first()
        )
    else:
        editor = (
            session.query(DataDocEditor)
            .filter_by(uid=uid, doc_id=doc_or_board_id)
            .first()
        )

    # Check the user's direct permissions
    if permission_level == "read":
        if editor is not None and (editor.write or editor.read):
            return True
    else:
        if editor is not None and editor.write:
            return True

    # Get the user's inherited permissions
    inherited_editors = get_all_groups_and_group_members_with_access(
        doc_or_board_id=doc_or_board_id,
        editor_type=editor_type,
        uid=uid,
        session=session,
    )

    if permission_level == "read":
        if len(inherited_editors) == 1:
            return True
    else:
        if len(inherited_editors) == 1:
            # Check if the editor's write privileges are true
            if inherited_editors[0][3]:
                return True

    return False
