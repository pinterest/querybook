from typing import List, Optional, Tuple, Union
from app.db import with_session
from models import UserGroupMember, User, DataDocEditor, BoardEditor
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from const.permissions import BoardDataDocPermission


@with_session
def get_all_groups_and_group_members_with_access(
    doc_or_board_id: int,
    editor_type: Union[DataDocEditor, BoardEditor],
    uid: Optional[int] = None,
    session: Optional[Session] = None,
) -> List[Tuple[int, int, bool, bool, bool]]:
    """
    Get all groups and group members with access to a DataDoc or Board.

    Args:
        doc_or_board_id: The ID of the DataDoc or Board.
        editor_type: The type of editor (DataDocEditor or BoardEditor).
        uid: The ID of the user to filter by (optional)
        session: The database session to use.

    Returns:
        A list of tuples containing the editor ID, the group or user ID, and the most permissive read, write, and execute permissions.
        Editors with inherited permissions have their ID set to None.
    """
    if editor_type == DataDocEditor:
        topq = session.query(
            editor_type.id,
            editor_type.uid,
            editor_type.read,
            editor_type.write,
            editor_type.execute,
        ).select_from(editor_type)
    elif editor_type == BoardEditor:
        # BoardEditor doesn't have execute permission, so we use False as default
        topq = session.query(
            editor_type.id, editor_type.uid, editor_type.read, editor_type.write
        ).select_from(editor_type)

    # Filter by the doc or board ID to get the editors for the specific doc or board
    if editor_type == DataDocEditor:
        topq = topq.filter(editor_type.data_doc_id == doc_or_board_id)
    elif editor_type == BoardEditor:
        topq = topq.filter(editor_type.board_id == doc_or_board_id)

    topq = topq.cte("cte", recursive=True)

    if editor_type == DataDocEditor:
        bottomq = (
            select(
                [None, UserGroupMember.uid, topq.c.read, topq.c.write, topq.c.execute]
            )
            .select_from(topq)
            .join(User, topq.c.uid == User.id)
            .join(UserGroupMember, UserGroupMember.gid == User.id)
            .filter(User.is_group)
        )
    elif editor_type == BoardEditor:
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

    if editor_type == DataDocEditor:
        q = select(
            [
                func.max(editors.c.id),
                editors.c.uid,
                func.max(editors.c.read),
                func.max(editors.c.write),
                func.max(editors.c.execute),
            ]
        ).group_by(editors.c.uid)
    elif editor_type == BoardEditor:
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
    doc_or_board_id: int,
    permission_level: BoardDataDocPermission,
    editor_type: Union[DataDocEditor, BoardEditor],
    uid: int,
    session: Optional[Session] = None,
) -> bool:
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
    if permission_level == BoardDataDocPermission.READ:
        if editor is not None and (editor.write or editor.execute or editor.read):
            return True
    elif permission_level == BoardDataDocPermission.EXECUTE:
        if editor is not None and (editor.write or editor.execute):
            return True
    elif permission_level == BoardDataDocPermission.WRITE:
        if editor is not None and editor.write:
            return True

    # Get the user's inherited permissions
    inherited_editors = get_all_groups_and_group_members_with_access(
        doc_or_board_id=doc_or_board_id,
        editor_type=editor_type,
        uid=uid,
        session=session,
    )

    if len(inherited_editors) == 0:
        return False

    if permission_level == BoardDataDocPermission.READ:
        return True
    elif permission_level == BoardDataDocPermission.EXECUTE:
        # Check if the editor's execute or write privileges are true
        if inherited_editors[0][3] or inherited_editors[0][4]:  # write or execute
            return True
    elif permission_level == BoardDataDocPermission.WRITE:
        # Check if the editor's write privileges are true
        if inherited_editors[0][3]:
            return True

    return False
