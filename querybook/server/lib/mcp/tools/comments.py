from typing import Annotated

from fastmcp import FastMCP
from fastmcp.server.auth import AccessToken
from fastmcp.server.dependencies import CurrentAccessToken

from app.db import DBSession
from lib.mcp.lib.comments import serialize_comment, serialize_reaction
from lib.mcp.utils import CREATE_ANNOTATIONS, DELETE_ANNOTATIONS, WRITE_ANNOTATIONS
from logic.comment import (
    add_comment_to_data_cell,
    add_thread_comment,
    get_comment_by_id,
    edit_comment,
    add_reaction,
    remove_reaction,
)
from logic.datadoc import get_data_cell_by_id
from logic.datadoc_permission import user_can_read, DocDoesNotExist
from models.comment import CommentReaction, DataCellComment
from models.datadoc import DataDocDataCell


def register(mcp: FastMCP) -> None:
    """Register comment tools on the given MCP server."""

    @mcp.tool(
        title="Add DataDoc Cell Comment",
        annotations=CREATE_ANNOTATIONS,
    )
    def add_datadoc_cell_comment(
        cell_id: Annotated[int, "ID of the DataDoc cell to comment on"],
        text: Annotated[str, "Comment text"],
        parent_comment_id: Annotated[
            int | None, "Parent comment ID for thread replies"
        ] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Add a comment to a DataDoc cell, optionally as a reply to another comment."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            # Permission check
            cell = get_data_cell_by_id(cell_id, session=session)
            if not cell:
                raise ValueError(f"DataDoc cell {cell_id} not found.")

            # Get datadoc_id from cell's data_doc_cells relationship
            doc_cell = (
                session.query(DataDocDataCell)
                .filter(DataDocDataCell.data_cell_id == cell_id)
                .first()
            )
            if not doc_cell:
                raise ValueError(
                    f"DataDoc cell {cell_id} is not associated with a DataDoc."
                )
            datadoc_id = doc_cell.data_doc_id

            try:
                if not user_can_read(datadoc_id, uid, session=session):
                    raise ValueError("You do not have access to this DataDoc.")
            except DocDoesNotExist:
                raise ValueError(f"DataDoc {datadoc_id} not found.")

            # Create comment
            if parent_comment_id is not None:
                comment = add_thread_comment(
                    parent_comment_id, uid, text, session=session
                )
            else:
                comment = add_comment_to_data_cell(cell_id, uid, text, session=session)

            # New comments have no reactions yet
            return serialize_comment(comment, [])

    @mcp.tool(
        title="Update DataDoc Cell Comment",
        annotations=WRITE_ANNOTATIONS,
    )
    def update_datadoc_cell_comment(
        comment_id: Annotated[int, "DataDoc cell comment ID"],
        text: Annotated[str | None, "New comment text"] = None,
        archived: Annotated[bool | None, "Archive/unarchive the comment"] = None,
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Update a DataDoc cell comment's text or archive status. Only non-null fields are updated."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            comment = get_comment_by_id(comment_id, session=session)
            if not comment:
                raise ValueError(f"Comment {comment_id} not found.")

            if comment.created_by != uid:
                raise ValueError("You can only edit your own comments.")

            fields = {}
            if text is not None:
                fields["text"] = text
            if archived is not None:
                fields["archived"] = archived

            edit_comment(comment_id, session=session, **fields)

            # Return updated comment with reactions
            comment = get_comment_by_id(comment_id, session=session)
            reactions = (
                session.query(CommentReaction)
                .filter(CommentReaction.comment_id == comment_id)
                .all()
            )
            return serialize_comment(comment, reactions)

    @mcp.tool(
        title="Delete DataDoc Cell Comment",
        annotations=DELETE_ANNOTATIONS,
    )
    def delete_datadoc_cell_comment(
        comment_id: Annotated[int, "DataDoc cell comment ID"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Delete (archive) a DataDoc cell comment. This is a soft delete."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            comment = get_comment_by_id(comment_id, session=session)
            if not comment:
                raise ValueError(f"Comment {comment_id} not found.")

            if comment.created_by != uid:
                raise ValueError("You can only delete your own comments.")

            edit_comment(comment_id, archived=True, session=session)
            return {"deleted": comment_id, "archived": True}

    @mcp.tool(
        title="Add Comment Reaction",
        annotations=CREATE_ANNOTATIONS,
    )
    def add_comment_reaction(
        comment_id: Annotated[int, "Comment ID to react to"],
        reaction: Annotated[str, "Reaction emoji or text"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Add a reaction to a comment."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            # Check if comment exists
            comment = get_comment_by_id(comment_id, session=session)
            if not comment:
                raise ValueError(f"Comment {comment_id} not found.")

            # Check permission: can read the datadoc containing this comment
            cell_comment = (
                session.query(DataCellComment)
                .filter(DataCellComment.comment_id == comment_id)
                .first()
            )

            if cell_comment:
                # This is a DataDoc cell comment - verify read permission
                cell = get_data_cell_by_id(cell_comment.data_cell_id, session=session)
                if not cell:
                    raise ValueError("DataDoc cell not found.")

                # Get datadoc_id from cell's data_doc_cells relationship
                doc_cell = (
                    session.query(DataDocDataCell)
                    .filter(DataDocDataCell.data_cell_id == cell.id)
                    .first()
                )
                if not doc_cell:
                    raise ValueError("DataDoc cell is not associated with a DataDoc.")

                datadoc_id = doc_cell.data_doc_id
                try:
                    if not user_can_read(datadoc_id, uid, session=session):
                        raise ValueError("You do not have access to this comment.")
                except DocDoesNotExist:
                    raise ValueError("DataDoc not found.")
            # If it's not a DataDoc cell comment, it's a table comment - no permission check needed

            # Add the reaction
            reaction_obj = add_reaction(
                comment_id=comment_id, reaction=reaction, uid=uid, session=session
            )

            return serialize_reaction(reaction_obj)

    @mcp.tool(
        title="Remove Comment Reaction",
        annotations=DELETE_ANNOTATIONS,
    )
    def remove_comment_reaction(
        reaction_id: Annotated[int, "Reaction ID to remove"],
        token: AccessToken = CurrentAccessToken(),
    ) -> dict:
        """Remove a reaction from a comment. You can only remove your own reactions."""
        uid = token.claims["creator_uid"]
        with DBSession() as session:
            # Check if reaction exists
            reaction = session.query(CommentReaction).get(reaction_id)
            if not reaction:
                raise ValueError(f"Reaction {reaction_id} not found.")

            # Check if user owns this reaction
            if reaction.created_by != uid:
                raise ValueError("You can only remove your own reactions.")

            # Remove the reaction
            remove_reaction(reaction_id, session=session)
            return {"deleted": reaction_id}
