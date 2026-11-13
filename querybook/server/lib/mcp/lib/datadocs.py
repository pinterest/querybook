"""DataDoc utility functions for MCP tools."""

from collections import defaultdict

from lib.mcp.lib.comments import serialize_comments
from lib.mcp.lib.query_executions import serialize_query_execution
from lib.mcp.lib.schedules import serialize_schedule
from lib.mcp.utils import build_querybook_url
from logic.datadoc import (
    get_data_cell_by_id,
    get_data_doc_by_id,
    get_data_doc_editors_by_doc_id,
    get_data_cells_executions,
)
from logic.datadoc_permission import DocDoesNotExist, user_can_read
from logic.schedule import get_task_schedule_by_name, get_data_doc_schedule_name
from models.comment import Comment, DataCellComment
from models.datadoc import DataDocDataCell, FavoriteDataDoc
from models.environment import Environment


def serialize_datadoc_editor(editor) -> dict:
    """Serialize a DataDoc editor model with user resource URI.

    Args:
        editor: DataDocEditor model object

    Returns:
        Dict with all editor fields and user_resource_uri
    """
    editor_dict = editor.to_dict()
    editor_dict["user_resource_uri"] = f"querybook://user/{editor.uid}"
    return editor_dict


def serialize_datadoc_cell(
    cell_dict: dict,
    session,
    with_latest_execution: bool = False,
    datadoc_id: int | None = None,
) -> dict:
    """Serialize a DataDoc cell dict with resource URIs and optional enrichments.

    Args:
        cell_dict: Cell dictionary (from cell.to_dict())
        session: Database session
        with_latest_execution: If True, add latest_execution for query cells
        datadoc_id: If provided, add datadoc_id and datadoc_resource_uri

    Returns:
        Enriched cell dict with resource URIs and optional data
    """
    cell_id = cell_dict["id"]
    cell_dict["resource_uri"] = f"querybook://datadoc-cell/{cell_id}"
    cell_dict["comments_resource_uri"] = (
        f"querybook://datadoc-cell/{cell_id}/comments?include_threads=true"
    )

    # Add executions_resource_uri for query cells
    if cell_dict.get("cell_type") == "query":
        cell_dict["executions_resource_uri"] = (
            f"querybook://datadoc-cell/{cell_id}/executions?limit=&offset="
        )

        # Add latest execution if requested
        if with_latest_execution:
            cells_executions = get_data_cells_executions([cell_id], session=session)
            if cells_executions and cells_executions[0][1]:
                latest_execution = cells_executions[0][1][0]  # First execution in list
                cell_dict["latest_execution"] = serialize_query_execution(
                    latest_execution
                )
            else:
                cell_dict["latest_execution"] = None

    # Add parent datadoc reference if provided
    if datadoc_id is not None:
        cell_dict["datadoc_id"] = datadoc_id
        cell_dict["datadoc_resource_uri"] = f"querybook://datadoc/{datadoc_id}"

    return cell_dict


def serialize_datadoc(
    doc,
    session,
    uid: int | None = None,
    with_cells: bool = False,
    with_editors: bool = False,
    with_schedule: bool = False,
    with_comments: bool = False,
) -> dict:
    """Serialize a DataDoc model to dict with all fields, resource_uri, and URL.

    Args:
        doc: DataDoc model object
        session: Database session
        uid: User ID to check if this DataDoc is favorited by this user
        with_cells: If True, include cells
        with_editors: If True, include editors
        with_schedule: If True, include schedule details
        with_comments: If True, include comments for each cell (requires with_cells=True)

    Returns:
        Dict with all datadoc fields, resource_uri, url, favorite status, and optional related data
    """
    result = doc.to_dict(with_cells=with_cells)
    result["owner_resource_uri"] = f"querybook://user/{doc.owner_uid}"

    # Serialize each cell with resource URIs and latest executions
    if with_cells and "cells" in result:
        # Batch-fetch latest executions for all query cells (single DB query)
        query_cell_ids = [
            cell["id"] for cell in result["cells"] if cell.get("cell_type") == "query"
        ]
        latest_executions_by_cell = {}
        if query_cell_ids:
            cells_executions = get_data_cells_executions(
                query_cell_ids, session=session
            )
            for cell_id, executions in cells_executions:
                if executions:
                    latest_executions_by_cell[cell_id] = executions[0]

        for cell in result["cells"]:
            serialize_datadoc_cell(cell, session)
            # Attach pre-fetched latest execution for query cells
            if cell.get("cell_type") == "query":
                execution = latest_executions_by_cell.get(cell["id"])
                cell["latest_execution"] = (
                    serialize_query_execution(execution) if execution else None
                )

    # Check if this DataDoc is favorited by the current user
    if uid is not None:
        favorite = (
            session.query(FavoriteDataDoc)
            .filter_by(data_doc_id=doc.id, uid=uid)
            .first()
        )
        result["favorite"] = favorite is not None
    else:
        result["favorite"] = False

    if with_editors:
        editors = get_data_doc_editors_by_doc_id(doc.id, session=session)
        result["editors"] = [serialize_datadoc_editor(editor) for editor in editors]

    if with_schedule:
        schedule_name = get_data_doc_schedule_name(doc.id)
        schedule = get_task_schedule_by_name(schedule_name, session=session)
        result["schedule"] = serialize_schedule(schedule) if schedule else None

    if with_comments and with_cells and "cells" in result:
        # Get all cell IDs
        cell_ids = [cell["id"] for cell in result["cells"]]

        # Group comments by cell_id
        comments_by_cell = defaultdict(list)

        if cell_ids:
            # Batch fetch all comments for all cells
            cell_comments = (
                session.query(DataCellComment)
                .filter(DataCellComment.data_cell_id.in_(cell_ids))
                .all()
            )

            # Get all comment IDs
            comment_ids = [cc.comment_id for cc in cell_comments]

            # Batch fetch all comments
            if comment_ids:
                comments = (
                    session.query(Comment).filter(Comment.id.in_(comment_ids)).all()
                )

                # Serialize all comments with threads and reactions
                serialized_comments = serialize_comments(
                    comments, session, include_threads=True
                )

                # Create a map of comment_id to serialized comment
                comments_dict = {c["id"]: c for c in serialized_comments}

                # Group by cell_id
                for cc in cell_comments:
                    if cc.comment_id in comments_dict:
                        comments_by_cell[cc.data_cell_id].append(
                            comments_dict[cc.comment_id]
                        )

        # Add comments to each cell
        for cell in result["cells"]:
            cell["comments"] = comments_by_cell.get(cell["id"], [])

    # Add resource_uri and URL
    result["resource_uri"] = f"querybook://datadoc/{doc.id}"

    environment = session.query(Environment).get(doc.environment_id)
    if environment:
        url = build_querybook_url(environment.name, f"datadoc/{doc.id}")
        if url:
            result["url"] = url

    return result


def get_datadoc_data(datadoc_id: int, uid: int, session) -> dict:
    """Get datadoc data with permission checking.

    Args:
        datadoc_id: DataDoc ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized datadoc dict

    Raises:
        ValueError: If datadoc not found or user lacks permission
    """
    try:
        if not user_can_read(datadoc_id, uid, session=session):
            raise ValueError("You do not have access to this DataDoc.")
    except DocDoesNotExist:
        raise ValueError(f"DataDoc {datadoc_id} not found.")

    doc = get_data_doc_by_id(id=datadoc_id, session=session)
    return serialize_datadoc(
        doc,
        session,
        uid=uid,
        with_cells=True,
        with_editors=True,
        with_schedule=True,
        with_comments=True,
    )


def get_datadoc_cell_data(cell_id: int, uid: int, session) -> dict:
    """Get datadoc cell data with permission checking.

    Args:
        cell_id: DataDoc cell ID
        uid: User ID for permission checking
        session: Database session

    Returns:
        Serialized cell dict with resource_uri and comments_resource_uri

    Raises:
        ValueError: If cell not found or user lacks permission
    """
    cell = get_data_cell_by_id(cell_id, session=session)
    if not cell:
        raise ValueError(f"DataDoc cell {cell_id} not found.")

    # Get parent datadoc for permission check
    doc_cell = session.query(DataDocDataCell).filter_by(data_cell_id=cell_id).first()
    if not doc_cell:
        raise ValueError(f"DataDoc cell {cell_id} not associated with any datadoc.")

    # Check permission on parent datadoc
    try:
        if not user_can_read(doc_cell.data_doc_id, uid, session=session):
            raise ValueError("You do not have access to this DataDoc cell.")
    except DocDoesNotExist:
        raise ValueError("Parent DataDoc not found.")

    # Serialize cell with all enrichments
    result = cell.to_dict()
    serialize_datadoc_cell(
        result,
        session,
        with_latest_execution=True,
        datadoc_id=doc_cell.data_doc_id,
    )
    return result


def get_datadoc_cell_executions_data(
    cell_id: int, uid: int, session, limit: int = 20, offset: int = 0
) -> list[dict]:
    """Get execution history for a DataDoc cell with permission checking.

    Args:
        cell_id: DataDoc cell ID
        uid: User ID for permission checking
        session: Database session
        limit: Maximum number of results to return
        offset: Number of results to skip

    Returns:
        List of serialized execution dicts

    Raises:
        ValueError: If cell not found or user lacks permission
    """

    cell = get_data_cell_by_id(cell_id, session=session)
    if not cell:
        raise ValueError(f"DataDoc cell {cell_id} not found.")

    # Get parent datadoc for permission check
    doc_cell = session.query(DataDocDataCell).filter_by(data_cell_id=cell_id).first()
    if not doc_cell:
        raise ValueError(f"DataDoc cell {cell_id} not associated with any datadoc.")

    # Check permission on parent datadoc
    try:
        if not user_can_read(doc_cell.data_doc_id, uid, session=session):
            raise ValueError("You do not have access to this DataDoc cell.")
    except DocDoesNotExist:
        raise ValueError("Parent DataDoc not found.")

    # Get executions
    cells_executions = get_data_cells_executions([cell_id], session=session)
    if not cells_executions or not cells_executions[0][1]:
        return []

    executions = cells_executions[0][1]

    # Slice first, then serialize (avoid serializing executions we won't return)
    page = executions[offset : offset + limit]
    return [serialize_query_execution(execution) for execution in page]
