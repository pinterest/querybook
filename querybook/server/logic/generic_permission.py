from typing import List, Optional, Tuple, Union
from app.db import with_session
from models import UserGroupMember, User, DataDocEditor, BoardEditor
from sqlalchemy import func, select, Integer
from sqlalchemy.orm import Session
from const.permissions import Permission


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
        A list of tuples containing the editor ID, the group or user ID, and the most permissive read and write
        permissions. This means that if a user has write=true but inherits write=false, their write will remain true.
        Likewise, if a user has write=false and inherits write=true, their write will become true. This tuple will
        appear in the form "(editor_id, uid, read, write)". Editors with inherited permissions have their editor_ID set
        to None.
    """

    # Begin constructing the top query, starting by selecting editors of the required type (doc or board)
    topq = session.query(
        editor_type.id, editor_type.uid, editor_type.read, editor_type.write
    ).select_from(editor_type)

    # Filter by the doc or board ID to get the editors for the specific doc or board
    if editor_type == DataDocEditor:
        topq = topq.filter(editor_type.data_doc_id == doc_or_board_id)
    elif editor_type == BoardEditor:
        topq = topq.filter(editor_type.board_id == doc_or_board_id)

    topq = topq.cte("cte", recursive=True)

    # This bottom query determines if the user is a group or a user, and then selects the group members
    bottomq = (
        select([None, UserGroupMember.uid, topq.c.read, topq.c.write])
        .select_from(topq)
        .join(User, topq.c.uid == User.id)
        .join(UserGroupMember, UserGroupMember.gid == User.id)
        .filter(User.is_group)
    )

    # This is then applied recursively to the top query
    recursive_q = topq.union(bottomq)

    editors = recursive_q.alias()

    q = select(
        [
            func.max(editors.c.id),
            editors.c.uid,
            func.max(
                editors.c.read.cast(Integer)
            ),  # Get the most permissive read permissions
            func.max(
                editors.c.write.cast(Integer)
            ),  # Get the most permissive write permissions
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
    """
    Check if the user has the specified permission for the specified datadoc or board.

    Args:
        doc_or_board_id: The ID of the DataDoc or Board.
        permission_level: The permission level to check for (READ or WRITE).
        editor_type: The type of editor (DataDocEditor or BoardEditor).
        uid: The ID of the user.
        session: The database session to use.

    Returns:
        True or False depending on whether the user has the specified permission.
    """
    if editor_type == BoardEditor:
        editor = (
            session.query(BoardEditor)
            .filter_by(uid=uid, board_id=doc_or_board_id)
            .first()
        )
    else:
        editor = (
            session.query(DataDocEditor)
            .filter_by(uid=uid, data_doc_id=doc_or_board_id)
            .first()
        )

    # Check the user's direct permissions
    if permission_level == Permission.READ:
        if editor is not None and (editor.write or editor.read):
            return True
    elif permission_level == Permission.WRITE:
        if editor is not None and editor.write:
            return True

    # Get the user's inherited permissions
    inherited_editors = get_all_groups_and_group_members_with_access(
        doc_or_board_id=doc_or_board_id,
        editor_type=editor_type,
        uid=uid,
        session=session,
    )

    if permission_level == Permission.READ:
        if len(inherited_editors) == 1:
            return True
    elif permission_level == Permission.WRITE:
        if len(inherited_editors) == 1:
            # Check if the editor's write privileges are true
            if inherited_editors[0][3]:
                return True

    return False
