"""Comment utility functions for MCP tools and resources."""

from collections import defaultdict

from logic.comment import get_comment_by_id, get_comments_by_data_cell_id
from logic.datadoc import get_data_cell_by_id
from logic.datadoc_permission import user_can_read, DocDoesNotExist
from models.comment import Comment, CommentReaction, DataCellComment
from models.datadoc import DataDocDataCell


def serialize_reaction(reaction) -> dict:
    """Serialize a CommentReaction model to dict."""
    return {
        "id": reaction.id,
        "reaction": reaction.reaction,
        "created_by": reaction.created_by,
        "created_by_resource_uri": f"querybook://user/{reaction.created_by}",
    }


def serialize_comment(comment, reactions: list = None) -> dict:
    """Serialize a Comment model to dict.

    Args:
        comment: Comment model object
        reactions: Optional list of CommentReaction objects for this comment
    """
    return {
        "id": comment.id,
        "text": "" if comment.archived else comment.text,
        "created_by": comment.created_by,
        "created_by_resource_uri": f"querybook://user/{comment.created_by}",
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "updated_at": comment.updated_at.isoformat() if comment.updated_at else None,
        "archived": comment.archived,
        "parent_comment_id": comment.parent_comment_id,
        "reactions": [serialize_reaction(r) for r in reactions] if reactions else [],
        "resource_uri": f"querybook://comment/{comment.id}",
    }


def serialize_comments(
    comments: list[Comment],
    session,
    include_threads: bool = True,
) -> list[dict]:
    """Serialize comments with optional thread replies and reactions.

    Args:
        comments: List of Comment objects to serialize
        session: Database session
        include_threads: If True, include thread replies for each comment

    Returns:
        List of serialized comment dicts with reactions and optional thread replies
    """
    if not comments:
        return []

    # Collect all comment IDs (top-level)
    all_comment_ids = [c.id for c in comments]
    replies_by_parent = defaultdict(list)

    if include_threads:
        # Fetch thread replies for all comments
        comment_ids = [c.id for c in comments]
        thread_replies = (
            session.query(Comment)
            .filter(Comment.parent_comment_id.in_(comment_ids))
            .order_by(Comment.created_at)
            .all()
        )

        # Group thread replies by parent_comment_id
        for reply in thread_replies:
            replies_by_parent[reply.parent_comment_id].append(reply)
            all_comment_ids.append(reply.id)

    # Batch fetch all reactions for all comments (both top-level and replies)
    reactions_by_comment = defaultdict(list)
    if all_comment_ids:
        reactions = (
            session.query(CommentReaction)
            .filter(CommentReaction.comment_id.in_(all_comment_ids))
            .all()
        )
        for reaction in reactions:
            reactions_by_comment[reaction.comment_id].append(reaction)

    # Serialize all comments
    result = []
    for comment in comments:
        comment_dict = serialize_comment(
            comment, reactions_by_comment.get(comment.id, [])
        )

        # Add thread replies if they exist
        if include_threads and comment.id in replies_by_parent:
            comment_dict["replies"] = [
                serialize_comment(reply, reactions_by_comment.get(reply.id, []))
                for reply in replies_by_parent[comment.id]
            ]

        result.append(comment_dict)

    return result


def get_comment_data(comment_id: int, uid: int, session) -> dict:
    """Get comment data with thread replies and reactions.

    Args:
        comment_id: Comment ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized comment dict with replies and reactions

    Raises:
        ValueError: If comment not found or user lacks permission
    """
    comment = get_comment_by_id(comment_id, session=session)
    if not comment:
        raise ValueError(f"Comment {comment_id} not found.")

    # Walk up to the root comment if this is a thread reply
    root_comment = comment
    if root_comment.parent_comment_id:
        root_comment = get_comment_by_id(
            root_comment.parent_comment_id, session=session
        )
        if not root_comment:
            raise ValueError("Parent comment not found.")

    # Find the DataDoc cell this comment belongs to
    doc_cell_comment = (
        session.query(DataCellComment)
        .filter(DataCellComment.comment_id == root_comment.id)
        .first()
    )
    if doc_cell_comment:
        doc_cell = (
            session.query(DataDocDataCell)
            .filter(DataDocDataCell.data_cell_id == doc_cell_comment.data_cell_id)
            .first()
        )
        if doc_cell:
            try:
                if not user_can_read(doc_cell.data_doc_id, uid, session=session):
                    raise ValueError(
                        "You do not have access to this comment's DataDoc."
                    )
            except DocDoesNotExist:
                raise ValueError("The DataDoc for this comment was not found.")

    # Serialize with threads and reactions
    result = serialize_comments([comment], session, include_threads=True)
    return result[0] if result else {}


def get_datadoc_cell_comments_data(
    cell_id: int, uid: int, include_threads: bool, session
) -> list[dict]:
    """Get comments for a DataDoc cell with permission checking.

    Args:
        cell_id: DataDoc cell ID
        uid: User ID for permission checking
        include_threads: Include thread replies for each comment
        session: Database session

    Returns:
        List of serialized comment dicts

    Raises:
        ValueError: If cell not found or user lacks permission
    """
    # Permission check
    cell = get_data_cell_by_id(cell_id, session=session)
    if not cell:
        raise ValueError(f"DataDoc cell {cell_id} not found.")

    doc_cell = (
        session.query(DataDocDataCell)
        .filter(DataDocDataCell.data_cell_id == cell_id)
        .first()
    )
    if not doc_cell:
        raise ValueError(f"DataDoc cell {cell_id} is not associated with a DataDoc.")
    datadoc_id = doc_cell.data_doc_id

    try:
        if not user_can_read(datadoc_id, uid, session=session):
            raise ValueError("You do not have access to this DataDoc.")
    except DocDoesNotExist:
        raise ValueError(f"DataDoc {datadoc_id} not found.")

    # Get comments
    comments = get_comments_by_data_cell_id(cell_id, session=session)

    # Serialize with threads and reactions
    return serialize_comments(comments, session, include_threads=include_threads)
