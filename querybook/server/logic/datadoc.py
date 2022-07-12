import datetime
from sqlalchemy import func

from app.db import with_session
from const.data_doc import DataCellType
from const.elasticsearch import ElasticsearchItem
from const.impression import ImpressionItemType
from const.query_execution import QueryExecutionStatus
from lib.sqlalchemy import update_model_fields
from lib.data_doc.data_cell import cell_types, sanitize_data_cell_meta
from logic.query_execution import get_last_query_execution_from_cell
from models.datadoc import (
    DataDoc,
    DataDocDataCell,
    DataCell,
    DataCellQueryExecution,
    QuerySnippet,
    FavoriteDataDoc,
    FunctionDocumentation,
    DataDocEditor,
    DataDocDAGExport,
)
from models.access_request import AccessRequest
from models.impression import Impression
from models.query_execution import QueryExecution
from tasks.sync_elasticsearch import sync_elasticsearch
from tasks.sync_es_queries_by_datadoc import (
    sync_es_queries_by_datadoc_id,
    sync_es_query_cells_by_datadoc_id,
)


"""
    ----------------------------------------------------------------------------------------------------------
    DATA DOC
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_data_doc(
    environment_id,
    owner_uid,
    cells=[],
    public=None,
    archived=None,
    title=None,
    meta=None,
    commit=True,
    session=None,
):
    data_doc = DataDoc(
        public=public,
        archived=archived,
        owner_uid=owner_uid,
        environment_id=environment_id,
        title=title,
        meta=meta,
    )
    session.add(data_doc)
    session.flush()

    for index, cell in enumerate(cells):
        data_cell = create_data_cell(
            cell_type=cell["type"],
            context=cell["context"],
            meta=cell["meta"],
            commit=False,
            session=session,
        )
        insert_data_doc_cell(
            data_doc_id=data_doc.id,
            cell_id=data_cell.id,
            index=index,
            commit=False,
            session=session,
        )
    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc.id)
        update_es_queries_by_datadoc_id(data_doc.id)
    else:
        session.flush()

    session.refresh(data_doc)
    return data_doc


@with_session
def create_data_doc_from_execution(
    environment_id,
    owner_uid,
    engine_id,
    query_string,
    execution_id,
    public=None,
    archived=None,
    title=None,
    meta=None,
    commit=True,
    session=None,
):
    data_doc = create_data_doc(
        environment_id=environment_id,
        owner_uid=owner_uid,
        cells=[
            {"type": "query", "context": query_string, "meta": {"engine": engine_id}}
        ],
        public=public,
        archived=archived,
        title=title,
        meta=meta,
        commit=False,
        session=session,
    )

    append_query_executions_to_data_cell(
        data_cell_id=data_doc.cells[0].id,
        query_execution_ids=[execution_id],
        commit=False,
        session=session,
    )
    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc.id)
        update_es_query_cell_by_id(data_doc.cells[0].id)
    else:
        session.flush()

    session.refresh(data_doc)
    return data_doc


@with_session
def update_data_doc(id, commit=True, session=None, **fields):
    data_doc = get_data_doc_by_id(id, session=session)

    if not data_doc:
        return

    updated = update_model_fields(
        data_doc,
        skip_if_value_none=True,
        field_names=["public", "archived", "owner_uid", "title", "meta"],
        **fields,
    )

    if updated:
        data_doc.updated_at = datetime.datetime.now()

        if commit:
            session.commit()
            update_es_data_doc_by_id(data_doc.id)

            # update es queries if doc is switched between public/private
            if "public" in fields:
                update_es_queries_by_datadoc_id(data_doc.id)
            # update es query cells if doc is archived
            elif fields.get("archived") is True:
                update_es_query_cells_by_data_doc_id(data_doc.id)
        else:
            session.flush()
        session.refresh(data_doc)
    return data_doc


@with_session
def get_data_doc_by_id(id, session=None):
    return session.query(DataDoc).get(id)


@with_session
def get_data_doc_by_user(uid, environment_id, offset, limit, session=None):
    query = (
        session.query(DataDoc)
        .filter_by(owner_uid=uid, archived=False, environment_id=environment_id)
        .order_by(DataDoc.id.desc())
    )
    return query.offset(offset).limit(limit).all()


@with_session
def get_all_data_docs(offset=0, limit=100, session=None):
    return (
        session.query(DataDoc)
        .filter_by(archived=False)
        .order_by(DataDoc.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


# You cannot delete data doc
@with_session
def delete_data_doc(session=None):
    pass


# You cannot delete data doc
@with_session
def clone_data_doc(id, owner_uid, commit=True, session=None):
    data_doc = get_data_doc_by_id(id, session=session)

    # Check to see if author has permission
    assert data_doc is not None, "Invalid data doc id"

    new_data_doc = create_data_doc(
        environment_id=data_doc.environment_id,
        public=data_doc.public,
        archived=False,
        owner_uid=owner_uid,
        title=data_doc.title,
        meta=data_doc.meta,
        commit=False,
        session=session,
    )

    for index, cell in enumerate(data_doc.cells):
        data_cell = create_data_cell(
            cell_type=cell.cell_type.name,
            context=cell.context,
            meta=cell.meta,
            commit=False,
            session=session,
        )
        insert_data_doc_cell(
            data_doc_id=new_data_doc.id,
            cell_id=data_cell.id,
            index=index,
            commit=False,
            session=session,
        )
    if commit:
        session.commit()
        update_es_data_doc_by_id(new_data_doc.id)
        update_es_queries_by_datadoc_id(new_data_doc.id)
    else:
        session.flush()
    session.refresh(new_data_doc)
    return new_data_doc


"""
    ----------------------------------------------------------------------------------------------------------
    DATA CELL
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def create_data_cell(
    cell_type=None, context=None, meta=None, commit=True, session=None
):
    assert cell_type in cell_types, "Invalid cell type"
    assert isinstance(context, str), "Context must be string"

    processed_meta = sanitize_data_cell_meta(cell_type, meta)
    data_cell = DataCell(
        cell_type=cell_type,
        context=context,
        meta=processed_meta,
    )

    session.add(data_cell)

    if commit:
        session.commit()
        data_cell.id
        if data_cell.cell_type == DataCellType.query:
            update_es_query_cell_by_id(data_cell.id)
    else:
        session.flush()

    return data_cell


@with_session
def update_data_cell(
    id,
    commit=True,
    session=None,
    **fields,
):
    data_cell = get_data_cell_by_id(id, session=session)
    if not data_cell:
        return
    if not data_cell.doc:
        raise Exception("A detached cell is read only")

    if "meta" in fields:
        fields["meta"] = sanitize_data_cell_meta(
            data_cell.cell_type.name, fields["meta"]
        )

    updated = update_model_fields(
        data_cell, skip_if_value_none=True, field_names=["meta", "context"], **fields
    )
    if updated:
        data_cell.updated_at = datetime.datetime.now()
        data_cell.doc.updated_at = datetime.datetime.now()

        if commit:
            session.commit()
            update_es_data_doc_by_id(data_cell.doc.id)

            if data_cell.cell_type == DataCellType.query:
                update_es_query_cell_by_id(data_cell.id)

    return data_cell


@with_session
def copy_cell_history(from_cell_id, to_cell_id, commit=True, session=None):
    # Remove all old execution for to_cell_id just for precaution
    session.query(DataCellQueryExecution).filter_by(data_cell_id=to_cell_id).delete()

    all_executions = (
        session.query(DataCellQueryExecution).filter_by(data_cell_id=from_cell_id).all()
    )

    session.bulk_save_objects(
        [
            DataCellQueryExecution(
                query_execution_id=execution.query_execution_id,
                data_cell_id=to_cell_id,
                latest=execution.latest,
            )
            for idx, execution in enumerate(all_executions)
        ]
    )

    if commit:
        session.commit()


@with_session
def get_data_cell_by_id(id, session=None):
    return session.query(DataCell).get(id)


@with_session
def delete_data_cell(session=None):
    pass


"""
    ----------------------------------------------------------------------------------------------------------
    DATA DOC DATA CELL
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_data_doc_data_cell(cell_id, session=None):
    return session.query(DataDocDataCell).filter_by(data_cell_id=cell_id).first()


@with_session
def insert_data_doc_cell(data_doc_id, cell_id, index, commit=True, session=None):
    data_doc = get_data_doc_by_id(data_doc_id, session=session)
    data_cell = get_data_cell_by_id(cell_id, session=session)

    assert index >= 0 and index <= len(data_doc.cells), "Invalid insert cell index"
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.cell_order >= index).update(
        {DataDocDataCell.cell_order: DataDocDataCell.cell_order + 1}
    )

    data_doc.cells.append(data_cell)
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.data_cell_id == cell_id).update(
        {DataDocDataCell.cell_order: index}
    )

    data_doc.updated_at = datetime.datetime.now()

    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc_id)

        if data_cell.cell_type == DataCellType.query:
            update_es_query_cell_by_id(data_cell.id)
    else:
        session.flush()


@with_session
def delete_data_doc_cell(data_doc_id, data_cell_id, commit=True, session=None):
    data_doc = get_data_doc_by_id(data_doc_id, session=session)

    data_doc_data_cell = (
        session.query(DataDocDataCell)
        .filter_by(data_doc_id=data_doc_id, data_cell_id=data_cell_id)
        .first()
    )

    assert data_doc_data_cell is not None, "Invalid cell to delete"

    index = data_doc_data_cell.cell_order
    # Remove the cell from the doc
    session.delete(data_doc_data_cell)

    # Shift cells below up by 1
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.cell_order > index).update(
        {DataDocDataCell.cell_order: DataDocDataCell.cell_order - 1}
    )

    data_doc.updated_at = datetime.datetime.now()

    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc_id)
        update_es_query_cell_by_id(data_cell_id)


@with_session
def move_data_doc_cell(data_doc_id, from_index, to_index, commit=True, session=None):
    data_doc = get_data_doc_by_id(data_doc_id, session=session)

    assert from_index != to_index, "Can't move same cell"
    assert from_index >= 0 and from_index < len(
        data_doc.cells
    ), "Invalid move from index"
    assert to_index >= 0 and to_index < len(data_doc.cells), "Invalid move to index"

    is_move_down = from_index < to_index

    # We will swap from_index to -from_index since this allows parallel
    # swapping of any other cells in this data doc but makes sure
    # cell at from_index is locked in place
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.cell_order == from_index).update(
        {DataDocDataCell.cell_order: -1}
    )

    if is_move_down:
        session.query(DataDocDataCell).filter(
            DataDocDataCell.data_doc_id == data_doc_id
        ).filter(DataDocDataCell.cell_order <= to_index).filter(
            DataDocDataCell.cell_order > from_index
        ).update(
            {DataDocDataCell.cell_order: DataDocDataCell.cell_order - 1}
        )
    else:
        # moving up
        session.query(DataDocDataCell).filter(
            DataDocDataCell.data_doc_id == data_doc_id
        ).filter(DataDocDataCell.cell_order >= to_index).filter(
            DataDocDataCell.cell_order < from_index
        ).update(
            {DataDocDataCell.cell_order: DataDocDataCell.cell_order + 1}
        )

    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.cell_order == -1).update(
        {DataDocDataCell.cell_order: to_index}
    )

    data_doc.updated_at = datetime.datetime.now()

    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc.id)
    return data_doc


@with_session
def move_data_doc_cell_to_doc(cell_id, data_doc_id, index, commit=True, session=None):
    """Move the cell to be at position index in the provided data doc.
       Special case when moving the cell in the same doc down, it will be
       moved to index - 1 since moving it causes all index to shift up 1.

    Arguments:
        cell_id {int} -- Id of cell that is getting moved
        data_doc_id {int} -- Data Doc id that will get the new cell
        index {int} -- The index moved to

    Keyword Arguments:
        commit {bool} -- (default: {True})
        session {Any} -- SQLalchemy session (default: {None})

    Returns:
        DataDoc -- The modified data doc
    """
    datadoc_datacell = get_data_doc_data_cell(cell_id, session=session)
    data_doc = get_data_doc_by_id(data_doc_id, session=session)
    assert datadoc_datacell, "Cell does not correspond to a doc"
    assert data_doc, "Invalid doc"

    old_doc_id = datadoc_datacell.data_doc_id
    old_data_doc = get_data_doc_by_id(old_doc_id, session=session)
    # If same doc, then reuse the move_data_doc_cell
    if old_doc_id == data_doc_id:
        from_index = datadoc_datacell.cell_order
        to_index = index

        # The behavior of this function is to insert the cell to be
        # ABOVE the cell at index, for special case of moving DOWN in the same
        # doc, we have to modify to index to be -1 so that the inserted cell
        # is above the current cell at index
        if from_index < to_index:  # Moving down
            to_index -= 1

        return move_data_doc_cell(
            data_doc_id,
            from_index,
            to_index,
            commit=commit,
            session=session,
        )

    # Move every cell in old doc below up 1
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == old_doc_id
    ).filter(DataDocDataCell.cell_order > datadoc_datacell.cell_order).update(
        {DataDocDataCell.cell_order: DataDocDataCell.cell_order - 1}
    )

    # Moving every cell in new doc below down 1
    session.query(DataDocDataCell).filter(
        DataDocDataCell.data_doc_id == data_doc_id
    ).filter(DataDocDataCell.cell_order >= index).update(
        {DataDocDataCell.cell_order: DataDocDataCell.cell_order + 1}
    )

    datadoc_datacell.data_doc_id = data_doc_id
    datadoc_datacell.cell_order = index

    now = datetime.datetime.now()
    data_doc.updated_at = now
    old_data_doc.updated_at = now

    if commit:
        session.commit()
        update_es_data_doc_by_id(data_doc.id)
        update_es_data_doc_by_id(old_data_doc.id)

        data_cell = get_data_cell_by_id(datadoc_datacell.data_cell_id, session=session)
        if data_cell.cell_type == DataCellType.query:
            update_es_query_cell_by_id(data_cell.id)
    return data_doc


@with_session
def get_data_doc_by_data_cell_id(data_cell_id, session=None):
    data_cell = get_data_cell_by_id(data_cell_id, session=session)
    if not data_cell:
        return
    return data_cell.doc


"""
    ----------------------------------------------------------------------------------------------------------
    FUNCTION DOCUMENTATION
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_function_documentation_by_language(language, session=None):
    return (
        session.query(FunctionDocumentation)
        .filter(FunctionDocumentation.language == language)
        .all()
    )


@with_session
def get_function_documentation_by_id(id, session=None):
    return (
        session.query(FunctionDocumentation)
        .filter(FunctionDocumentation.id == id)
        .all()
    )


@with_session
def truncate_function_documentation(session=None):
    session.query(FunctionDocumentation).delete()


@with_session
def create_function_documentation(
    language=None,
    name=None,
    params=None,
    return_type=None,
    description=None,
    session=None,
):
    function_documentation = FunctionDocumentation(
        language=language,
        name=name,
        params=params,
        return_type=return_type,
        description=description,
    )
    session.add(function_documentation)

    session.commit()
    function_documentation.id

    return function_documentation


"""
    ----------------------------------------------------------------------------------------------------------
    SNIPPETS
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def search_snippet(
    search_by, engine_ids=[], is_public=False, golden=None, session=None
):
    query = session.query(QuerySnippet.id, QuerySnippet.title).filter(
        QuerySnippet.is_public == is_public
    )

    if not is_public:
        query = query.filter(QuerySnippet.created_by == search_by)

    if golden is not None:
        query = query.filter(QuerySnippet.golden == golden)

    if len(engine_ids or []):
        query = query.filter(QuerySnippet.engine_id.in_(engine_ids))
    return query.all()


@with_session
def get_snippet_by_id(snippet_id, session=None):
    return session.query(QuerySnippet).get(snippet_id)


@with_session
def update_snippet_by_id(
    snippet_id,
    updated_by,
    context=None,
    description=None,
    title=None,
    engine_id=None,
    is_public=None,
    golden=None,
    session=None,
):
    snippet = get_snippet_by_id(snippet_id, session=session)

    if not snippet:
        return None

    if context is not None:
        snippet.context = context
    if title is not None:
        snippet.title = title
    if description is not None:
        snippet.description = description
    if engine_id is not None:
        snippet.engine_id = engine_id
    if is_public is not None:
        snippet.is_public = is_public
    if golden is not None:
        snippet.golden = golden

    snippet.updated_at = datetime.datetime.now()
    snippet.last_updated_by = updated_by

    session.commit()
    snippet.id

    return snippet


@with_session
def create_snippet(
    created_by,
    engine_id,
    context="",
    title="",
    description="",
    is_public=False,
    golden=False,
    session=None,
):
    snippet = QuerySnippet(
        context=context,
        title=title,
        engine_id=engine_id,
        is_public=is_public,
        golden=golden,
        description=description,
        created_by=created_by,
        last_updated_by=created_by,
    )

    session.add(snippet)
    session.commit()

    snippet.id
    return snippet


@with_session
def delete_snippet(snippet_id, deleted_by, session=None):
    snippet = get_snippet_by_id(snippet_id, session=session)

    if snippet:
        session.delete(snippet)
        session.commit()


"""
    ----------------------------------------------------------------------------------------------------------
    FAVORITE DATA DOC
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_user_favorite_data_docs(uid, environment_id, session=None):
    return (
        session.query(DataDoc)
        .join(FavoriteDataDoc)
        .filter(FavoriteDataDoc.uid == uid)
        .filter(DataDoc.environment_id == environment_id)
        .all()
    )


@with_session
def favorite_data_doc(data_doc_id, uid, session=None):
    favorite = (
        session.query(FavoriteDataDoc)
        .filter_by(data_doc_id=data_doc_id, uid=uid)
        .first()
    )
    if not favorite:
        favorite = FavoriteDataDoc(
            data_doc_id=data_doc_id,
            uid=uid,
        )
    session.add(favorite)
    session.commit()

    favorite.id
    return favorite


@with_session
def unfavorite_data_doc(data_doc_id, uid, session=None):
    session.query(FavoriteDataDoc).filter(
        FavoriteDataDoc.data_doc_id == data_doc_id
    ).filter(FavoriteDataDoc.uid == uid).delete()
    session.commit()


"""
    ----------------------------------------------------------------------------------------------------------
    RECENT DATA DOC
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_user_recent_data_docs(uid, environment_id, limit=5, session=None):
    subquery_created_at = func.max(Impression.created_at).label("created_at")
    subquery = (
        session.query(Impression.item_id, subquery_created_at)
        .filter(Impression.item_type == ImpressionItemType.DATA_DOC)
        .filter(Impression.uid == uid)
        .group_by(Impression.item_id)
    ).subquery()

    return (
        session.query(DataDoc)
        .join(subquery, DataDoc.id == subquery.c.item_id)
        .filter(DataDoc.environment_id == environment_id)
        .order_by(subquery.c.created_at.desc())
        .limit(limit)
        .all()
    )


"""
    ----------------------------------------------------------------------------------------------------------
    DATA DOC EDITOR
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_data_doc_editor_by_id(id, session=None):
    return session.query(DataDocEditor).get(id)


@with_session
def get_data_doc_editors_by_doc_id(data_doc_id, session=None):
    return session.query(DataDocEditor).filter_by(data_doc_id=data_doc_id).all()


@with_session
def get_data_doc_writers_by_doc_id(doc_id, session=None):
    return session.query(DataDocEditor).filter_by(data_doc_id=doc_id, write=True).all()


@with_session
def create_data_doc_editor(
    data_doc_id, uid, read=False, write=False, commit=True, session=None
):
    editor = DataDocEditor(data_doc_id=data_doc_id, uid=uid, read=read, write=write)

    session.add(editor)
    if commit:
        session.commit()
        update_es_data_doc_by_id(editor.data_doc_id)
        update_es_queries_by_datadoc_id(editor.data_doc_id)
    else:
        session.flush()
    session.refresh(editor)
    return editor


@with_session
def update_data_doc_editor(
    id,
    read=None,
    write=None,
    commit=True,
    session=None,
    **fields,
):
    editor = get_data_doc_editor_by_id(id, session=session)
    if editor:
        updated = update_model_fields(
            editor, skip_if_value_none=True, read=read, write=write
        )

        if updated:
            if commit:
                session.commit()
                update_es_queries_by_datadoc_id(editor.data_doc_id)
            else:
                session.flush()
            session.refresh(editor)
        return editor


@with_session
def delete_data_doc_editor(id, doc_id, session=None, commit=True):
    session.query(DataDocEditor).filter_by(id=id).delete()
    if commit:
        session.commit()
        update_es_data_doc_by_id(doc_id)
        update_es_queries_by_datadoc_id(doc_id)


"""
    ----------------------------------------------------------------------------------------------------------
    DATA DOC ACCESS REQUESTS
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_data_doc_access_requests_by_doc_id(doc_id, session=None):
    return session.query(AccessRequest).filter_by(data_doc_id=doc_id).all()


@with_session
def get_data_doc_access_request_by_doc_id(doc_id, uid, session=None):
    return session.query(AccessRequest).filter_by(data_doc_id=doc_id, uid=uid).first()


@with_session
def create_data_doc_access_request(doc_id, uid, commit=True, session=None):
    request = AccessRequest(uid=uid, data_doc_id=doc_id)
    session.add(request)
    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(request)
    return request


@with_session
def remove_datadoc_access_request(doc_id, uid, session=None, commit=True):
    session.query(AccessRequest).filter_by(data_doc_id=doc_id, uid=uid).delete()
    if commit:
        session.commit()


"""
    ----------------------------------------------------------------------------------------------------------
    DATA CELL QUERY EXECUTION
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def append_query_executions_to_data_cell(
    data_cell_id, query_execution_ids=[], commit=True, session=None
):
    session.query(DataCellQueryExecution).filter(
        DataCellQueryExecution.data_cell_id == data_cell_id
    ).update({DataCellQueryExecution.latest: False})

    for qid in query_execution_ids:
        latest_query_execution = get_last_query_execution_from_cell(
            data_cell_id, session=session
        )
        dcqe = DataCellQueryExecution(
            data_cell_id=data_cell_id,
            query_execution_id=qid,
            latest=(not latest_query_execution or qid > latest_query_execution.id),
        )
        session.add(dcqe)

    if commit:
        session.commit()


@with_session
def get_data_cell_executions(id, session=None):
    data_cell = get_data_cell_by_id(id, session=session)
    return data_cell.query_executions


@with_session
def get_data_cells_executions(ids, session=None):
    data_cells = session.query(DataCell).filter(DataCell.id.in_(ids)).all()
    return [(data_cell.id, data_cell.query_executions) for data_cell in data_cells]


"""
    ----------------------------------------------------------------------------------------------------------
    ELASTICSEARCH
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_unarchived_query_cell_by_id(id, session=None):
    return (
        session.query(DataCell)
        .filter(DataCell.id == id)
        .filter(DataCell.cell_type == DataCellType.query)
        .join(DataDocDataCell)
        .join(DataDoc)
        .filter(DataDoc.archived.is_(False))
        .first()
    )


def update_es_data_doc_by_id(id):
    sync_elasticsearch.apply_async(args=[ElasticsearchItem.datadocs.value, id])


def update_es_queries_by_datadoc_id(id):
    sync_es_queries_by_datadoc_id.apply_async(args=[id])


def update_es_query_cells_by_data_doc_id(id):
    sync_es_query_cells_by_datadoc_id.apply_async(args=[id])


def update_es_query_cell_by_id(id):
    sync_elasticsearch.apply_async(args=[ElasticsearchItem.query_cells.value, id])


@with_session
def get_query_cells_by_data_doc_id(id, session=None):
    data_cells = (
        session.query(DataCell)
        .filter(DataCell.cell_type == DataCellType.query)
        .join(DataDocDataCell)
        .join(DataDoc)
        .filter(DataDoc.id == id)
        .all()
    )
    return data_cells


@with_session
def get_query_executions_by_data_doc_id(id, session=None):
    query_executions = (
        session.query(QueryExecution)
        .filter(QueryExecution.status == QueryExecutionStatus.DONE)
        .join(DataCellQueryExecution)
        .join(
            DataDocDataCell,
            DataCellQueryExecution.data_cell_id == DataDocDataCell.data_cell_id,
        )
        .filter(DataDocDataCell.data_doc_id == id)
        .all()
    )
    return query_executions


@with_session
def get_all_query_cells(offset=0, limit=100, session=None):
    return (
        session.query(DataCell)
        .filter_by(cell_type=DataCellType.query)
        .join(DataDocDataCell)
        .join(DataDoc)
        .filter(DataDoc.archived.is_(False))
        .offset(offset)
        .limit(limit)
        .all()
    )


def get_data_cell_by_query_execution_id(query_execution_id, session=None):
    return (
        session.query(DataCell)
        .join(DataCellQueryExecution)
        .filter(DataCellQueryExecution.query_execution_id == query_execution_id)
        .first()
    )


"""
    ----------------------------------------------------------------------------------------------------------
    DAG EXPORT
    ---------------------------------------------------------------------------------------------------------
"""


@with_session
def get_dag_export_by_data_doc_id(data_doc_id, session=None):
    return (
        session.query(DataDocDAGExport)
        .filter(DataDocDAGExport.data_doc_id == data_doc_id)
        .first()
    )


@with_session
def create_or_update_dag_export(data_doc_id, dag, meta, session=None):
    dag_export = get_dag_export_by_data_doc_id(data_doc_id, session=session)

    if dag_export:
        dag_export.dag = dag
        dag_export.meta = meta
        dag_export.updated_at = datetime.datetime.now()
    else:
        dag_export = DataDocDAGExport(data_doc_id=data_doc_id, dag=dag, meta=meta)
        session.add(dag_export)

    session.commit()
    return dag_export
