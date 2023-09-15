import math
import re
import time
from html import escape
from itertools import chain
from typing import Any, Dict, List, Optional, Set

from app.db import with_session
from const.ai_assistant import DEFAULT_SAMPLE_QUERY_COUNT
from const.impression import ImpressionItemType
from const.query_execution import QueryExecutionStatus
from lib.elasticsearch.search_query import construct_query_search_query
from lib.elasticsearch.search_utils import (
    ES_CONFIG,
    get_hosted_es,
    get_matching_objects,
)
from lib.logger import get_logger
from lib.query_analysis import lineage as lineage_lib
from lib.query_analysis.lineage import get_table_statement_type
from lib.richtext import richtext_to_plaintext
from lib.utils.utils import DATETIME_TO_UTC, with_exception
from logic import admin as admin_logic
from logic import datadoc as datadoc_logic
from logic.datadoc import (
    get_all_data_docs,
    get_all_query_cells,
    get_data_cell_by_query_execution_id,
    get_data_doc_by_id,
    get_unarchived_query_cell_by_id,
)
from logic.impression import (
    get_last_impressions_date,
    get_viewers_count_by_item_after_date,
)
from logic.metastore import (
    get_all_table,
    get_table_by_id,
    get_table_query_samples_count,
)
from logic.query_execution import (
    get_query_execution_by_id,
    get_successful_adhoc_query_executions,
    get_successful_query_executions_by_data_cell_id,
)
from models.board import Board
from models.datadoc import DataCellType
from models.user import User

LOG = get_logger(__file__)


def _get_dict_by_field(
    field_to_getter: Dict[str, Any], fields: Optional[List[str]] = None
) -> Dict[str, Any]:
    """Returns a partial dictionary based on the fields provided.
    Args:
        field_to_getter: dict of field key to a value or a callable (that must be called to generate a value)
        fields: list of fields to return in generated dict

    Returns:
        Dict[str, Any] - subset of the fields passed or the entire generated dict if fields is None
    """
    fields = fields or field_to_getter.keys()

    def get_field_value(field: str):
        getter = field_to_getter[field]
        return getter() if callable(getter) else getter

    return {
        field: get_field_value(field) for field in fields if field in field_to_getter
    }


def _get_datadoc_editors(datadoc, session) -> List[str]:
    if datadoc is None or datadoc.public:
        return []
    editors = datadoc_logic.get_data_doc_editors_by_doc_id(
        data_doc_id=datadoc.id, session=session
    )
    return [editor.uid for editor in editors]


def _get_table_names_from_query(query, language=None) -> List[str]:
    table_names, _ = lineage_lib.process_query(query, language=language)
    return list(chain.from_iterable(table_names))


"""
    QUERY EXECUTIONS
"""


@with_session
def _get_query_cell_executions_iter(batch_size=1000, fields=None, session=None):
    offset = 0
    while True:
        query_cells = get_all_query_cells(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        query_executions_count = 0
        for query_cell in query_cells:
            query_cell_executions_offset = 0
            while True:
                query_cell_executions = get_successful_query_executions_by_data_cell_id(
                    query_cell.id,
                    limit=batch_size,
                    offset=query_cell_executions_offset,
                    session=session,
                )
                for query_execution in query_cell_executions:
                    expand_query_execution = query_execution_to_es(
                        query_execution,
                        data_cell=query_cell,
                        fields=fields,
                        session=session,
                    )
                    yield expand_query_execution
                query_executions_count += len(query_cell_executions)
                if len(query_cell_executions) < batch_size:
                    break
                query_cell_executions_offset += batch_size
        LOG.info(
            "\n--Query cell count: {}, query cell executions count: {}, offset: {}".format(
                len(query_cells), query_executions_count, offset
            )
        )
        if len(query_cells) < batch_size:
            break
        offset += batch_size


@with_session
def _get_adhoc_query_executions_iter(batch_size=1000, fields=None, session=None):
    offset = 0
    while True:
        query_executions = get_successful_adhoc_query_executions(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info(
            "\n--Adhoc query executions count: {}, offset: {}".format(
                len(query_executions), offset
            )
        )

        for query_execution in query_executions:
            expand_query_execution = query_execution_to_es(
                query_execution, fields=fields, session=session
            )
            yield expand_query_execution

        if len(query_executions) < batch_size:
            break
        offset += batch_size


@with_session
def get_query_executions_iter(batch_size=1000, fields=None, session=None):
    yield from _get_query_cell_executions_iter(
        batch_size=batch_size, fields=fields, session=session
    )
    yield from _get_adhoc_query_executions_iter(
        batch_size=batch_size, fields=fields, session=session
    )


@with_session
def query_execution_to_es(query_execution, data_cell=None, fields=None, session=None):
    """data_cell is added as a parameter so that bulk insert of query executions won't require
    re-retrieval of data_cell"""
    engine_id = query_execution.engine_id
    engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
    datadoc = data_cell.doc if data_cell else None

    def get_duration():
        return (
            DATETIME_TO_UTC(query_execution.completed_at)
            - DATETIME_TO_UTC(query_execution.created_at)
            if query_execution.completed_at is not None
            else None
        )

    field_to_getter = {
        "id": query_execution.id,
        "query_type": "query_execution",
        "title": data_cell.meta.get("title", "Untitled") if data_cell else None,
        "environment_id": [env.id for env in engine.environments],
        "author_uid": query_execution.uid,
        "engine_id": engine_id,
        "statement_type": lambda: get_table_statement_type(query_execution.query),
        "created_at": lambda: DATETIME_TO_UTC(query_execution.created_at),
        "duration": get_duration,
        "full_table_name": lambda: _get_table_names_from_query(
            query_execution.query, language=(engine and engine.language)
        ),
        "query_text": query_execution.query,
        "public": datadoc is None or datadoc.public,
        "readable_user_ids": lambda: _get_datadoc_editors(datadoc, session=session),
    }

    return _get_dict_by_field(field_to_getter, fields=fields)


@with_exception
def _bulk_insert_query_executions():
    index_name = ES_CONFIG["query_executions"]["index_name"]

    for query_execution in get_query_executions_iter():
        _insert(index_name, query_execution["id"], query_execution)


@with_exception
def _bulk_update_query_executions(fields: Set[str] = None):
    index_name = ES_CONFIG["query_executions"]["index_name"]

    for query_execution in get_query_executions_iter(fields=fields):
        updated_body = {"doc": query_execution, "doc_as_upsert": True}
        _update(index_name, query_execution["id"], updated_body)


@with_exception
@with_session
def update_query_execution_by_id(query_execution_id, session=None):
    index_name = ES_CONFIG["query_executions"]["index_name"]

    query_execution = get_query_execution_by_id(query_execution_id, session=session)
    if query_execution is None or query_execution.status != QueryExecutionStatus.DONE:
        try:
            _delete(index_name, id=query_execution_id)
        except Exception:
            LOG.error("failed to delete {}. Will pass.".format(query_execution_id))
    else:
        data_cell = get_data_cell_by_query_execution_id(
            query_execution_id, session=session
        )
        formatted_object = query_execution_to_es(
            query_execution, data_cell=data_cell, session=session
        )
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, query_execution_id, updated_body)
        except Exception:
            LOG.error("failed to upsert {}. Will pass.".format(query_execution_id))


"""
    QUERY CELLS
"""


@with_session
def get_query_cells_iter(batch_size=1000, fields=None, session=None):
    offset = 0

    while True:
        query_cells = get_all_query_cells(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info(
            "\n--Query cells count: {}, offset: {}".format(len(query_cells), offset)
        )

        for query_cell in query_cells:
            expand_query_cell = query_cell_to_es(
                query_cell, fields=fields, session=session
            )
            yield expand_query_cell

        if len(query_cells) < batch_size:
            break
        offset += batch_size


@with_session
def query_cell_to_es(query_cell, fields=None, session=None):
    query_cell_meta = query_cell.meta
    query = query_cell.context
    datadoc = query_cell.doc

    engine_id = query_cell_meta.get("engine")
    engine = admin_logic.get_query_engine_by_id(engine_id, session=session)

    field_to_getter = {
        "id": query_cell.id,
        "query_type": "query_cell",
        "title": query_cell_meta.get("title", "Untitled"),
        "data_doc_id": datadoc and datadoc.id,
        "environment_id": datadoc and datadoc.environment_id,
        "author_uid": datadoc and datadoc.owner_uid,
        "engine_id": engine_id,
        "statement_type": lambda: get_table_statement_type(query),
        "created_at": lambda: DATETIME_TO_UTC(query_cell.created_at),
        "full_table_name": lambda: _get_table_names_from_query(
            query, language=(engine and engine.language)
        ),
        "query_text": query,
        "public": datadoc is not None and datadoc.public,
        "readable_user_ids": lambda: _get_datadoc_editors(datadoc, session=session),
    }

    return _get_dict_by_field(field_to_getter, fields=fields)


@with_exception
def _bulk_insert_query_cells():
    index_name = ES_CONFIG["query_cells"]["index_name"]

    for query_cell in get_query_cells_iter():
        _insert(index_name, query_cell["id"], query_cell)


@with_exception
def _bulk_update_query_cells(fields: Set[str] = None):
    index_name = ES_CONFIG["query_cells"]["index_name"]

    for query_cell in get_query_cells_iter(fields=fields):
        updated_body = {"doc": query_cell, "doc_as_upsert": True}
        _update(index_name, query_cell["id"], updated_body)


@with_exception
@with_session
def update_query_cell_by_id(query_cell_id, session=None):
    index_name = ES_CONFIG["query_cells"]["index_name"]

    query_cell = get_unarchived_query_cell_by_id(query_cell_id, session=session)
    if query_cell is None:
        try:
            _delete(index_name, id=query_cell_id)
        except Exception:
            LOG.error("failed to delete {}. Will pass.".format(query_cell_id))
    else:
        formatted_object = query_cell_to_es(query_cell, session=session)
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, query_cell_id, updated_body)

        except Exception:
            LOG.error("failed to upsert {}. Will pass.".format(query_cell_id))


def get_sample_query_cells_by_table_name(
    table_name: str, k: int = DEFAULT_SAMPLE_QUERY_COUNT
):
    """Get at most 50 sample queries from elasticsearch query_cell index by table name in the past half year."""

    # get timestamp of yesterday
    end_time = int(time.time()) - 24 * 60 * 60
    # get timestamp of 180 days ago
    start_time = end_time - 6 * 30 * 24 * 60 * 60

    filters = [
        ["full_table_name", [f"{table_name}"]],
        ["query_type", "query_cell"],
        ["statement_type", ["SELECT"]],
        ["startdate", start_time],
        ["enddate", end_time],
    ]

    query = construct_query_search_query(
        keywords="",
        filters=filters,
        limit=k,
        offset=0,
        sort_key="created_at",
        sort_order="desc",
    )

    # filter out query cells with "Untitled" title
    title_filter = {"bool": {"must_not": [{"match": {"title": "Untitled"}}]}}
    query.setdefault("query", {}).setdefault("bool", {}).setdefault(
        "filter", {}
    ).setdefault("bool", {}).setdefault("must", []).append(title_filter)

    index_name = ES_CONFIG["query_cells"]["index_name"]

    results = get_matching_objects(query, index_name, False)
    return results[:k]


"""
    DATA DOCS
"""


@with_session
def get_datadocs_iter(batch_size=5000, fields=None, session=None):
    offset = 0

    while True:
        data_docs = get_all_data_docs(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info("\n--Datadocs count: {}, offset: {}".format(len(data_docs), offset))

        for data_doc in data_docs:
            expand_datadoc = datadocs_to_es(data_doc, fields=fields, session=session)
            yield expand_datadoc

        if len(data_docs) < batch_size:
            break
        offset += batch_size


def get_joined_cells(datadoc):
    cells_as_text = []
    for cell in datadoc.cells:
        if cell.cell_type == DataCellType.text:
            cells_as_text.append(richtext_to_plaintext(cell.context))
        elif cell.cell_type == DataCellType.query:
            cell_title = cell.meta.get("title", "")
            cell_text = (
                cell.context if not cell_title else f"{cell_title}\n{cell.context}"
            )
            cells_as_text.append(cell_text)
        else:
            cells_as_text.append("[... additional unparsable content ...]")

    joined_cells = escape("\n".join(cells_as_text))
    return joined_cells


@with_session
def datadocs_to_es(datadoc, fields=None, session=None):
    field_to_getter = {
        "id": datadoc.id,
        "environment_id": datadoc.environment_id,
        "owner_uid": datadoc.owner_uid,
        "created_at": lambda: DATETIME_TO_UTC(datadoc.created_at),
        "cells": lambda: get_joined_cells(datadoc),
        "title": datadoc.title,
        "public": datadoc.public,
        "readable_user_ids": lambda: _get_datadoc_editors(datadoc, session=session),
    }
    return _get_dict_by_field(field_to_getter, fields=fields)


@with_exception
def _bulk_insert_datadocs():
    index_name = ES_CONFIG["datadocs"]["index_name"]

    for datadoc in get_datadocs_iter():
        _insert(index_name, datadoc["id"], datadoc)


@with_exception
def _bulk_update_datadocs(fields: Set[str] = None):
    index_name = ES_CONFIG["datadocs"]["index_name"]

    for datadoc in get_datadocs_iter(fields=fields):
        updated_body = {"doc": datadoc, "doc_as_upsert": True}
        _update(index_name, datadoc["id"], updated_body)


@with_exception
@with_session
def update_data_doc_by_id(doc_id, session=None):
    index_name = ES_CONFIG["datadocs"]["index_name"]

    doc = get_data_doc_by_id(doc_id, session=session)
    if doc is None or doc.archived:
        try:
            _delete(index_name, id=doc_id)
        except Exception:
            LOG.error("failed to delete {}. Will pass.".format(doc_id))
    else:
        formatted_object = datadocs_to_es(doc, session=session)
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, doc_id, updated_body)
        except Exception:
            LOG.error("failed to upsert {}. Will pass.".format(doc_id))


"""
    TABLES
"""


@with_session
def get_tables_iter(batch_size=5000, fields=None, session=None):
    offset = 0

    while True:
        tables = get_all_table(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info("\n--Table count: {}, offset: {}".format(len(tables), offset))

        for table in tables:
            expand_table = table_to_es(table, fields=fields, session=session)
            yield expand_table

        if len(tables) < batch_size:
            break
        offset += batch_size


@with_session
def get_table_weight(table_id: int, session=None) -> int:
    """Calculate the weight of table. Used for ranking in auto completion
       and sidebar table search. It produces a number >= 0


    Arguments:
        table_id {int} -- Id of DataTable

    Keyword Arguments:
        session -- Sqlalchemy DB session (default: {None})

    Returns:
        int -- The integer weight
    """
    num_samples = get_table_query_samples_count(table_id, session=session)
    num_impressions = get_viewers_count_by_item_after_date(
        ImpressionItemType.DATA_TABLE,
        table_id,
        get_last_impressions_date(),
        session=session,
    )
    boost_score = get_table_by_id(table_id, session=session).boost_score

    # Samples worth 10x as much as impression
    # Log the score to flatten the score distrution (since its power law distribution)
    return int(math.log2(((num_impressions + num_samples * 10) + 1) + boost_score))


@with_session
def table_to_es(table, fields=None, session=None):
    schema = table.data_schema
    schema_name = schema.name
    table_name = table.name
    full_name = "{}.{}".format(schema_name, table_name)

    # columns may be associated with the same data element
    data_elements = {d.name: d for c in table.columns for d in c.data_elements}.values()

    def get_table_description():
        return (
            richtext_to_plaintext(table.information.description, escape=True)
            if table.information
            else ""
        )

    def get_column_descriptions():
        return [
            richtext_to_plaintext(c.description, escape=True) for c in table.columns
        ]

    def get_data_element_descriptions():
        return [
            richtext_to_plaintext(d.description, escape=True) for d in data_elements
        ]

    weight = None

    def compute_weight():
        nonlocal weight
        if weight is None:
            weight = get_table_weight(table.id, session=session)
        return weight

    def get_completion_name():
        return {
            "input": [
                full_name,
                table_name,
            ],
            "weight": compute_weight(),
            "contexts": {
                "metastore_id": schema.metastore_id,
            },
        }

    field_to_getter = {
        "id": table.id,
        "metastore_id": schema.metastore_id,
        "schema": schema_name,
        "name": table_name,
        "full_name": full_name,
        "full_name_ngram": full_name,
        "completion_name": get_completion_name,
        "description": get_table_description,
        "created_at": lambda: DATETIME_TO_UTC(table.created_at),
        "columns": [c.name for c in table.columns],
        "column_descriptions": get_column_descriptions,
        "data_elements": [d.name for d in data_elements],
        "data_element_descriptions": get_data_element_descriptions,
        "golden": table.golden,
        "importance_score": compute_weight,
        "tags": [tag.tag_name for tag in table.tags],
    }
    return _get_dict_by_field(field_to_getter, fields=fields)


def _bulk_insert_tables():
    index_name = ES_CONFIG["tables"]["index_name"]

    for table in get_tables_iter():
        _insert(index_name, table["id"], table)


def _bulk_update_tables(fields: Set[str] = None):
    index_name = ES_CONFIG["tables"]["index_name"]

    for table in get_tables_iter(fields=fields):
        updated_body = {"doc": table, "doc_as_upsert": True}
        _update(index_name, table["id"], updated_body)


@with_exception
@with_session
def update_table_by_id(table_id, update_vector_store=False, session=None):
    index_name = ES_CONFIG["tables"]["index_name"]

    table = get_table_by_id(table_id, session=session)
    if table is None:
        delete_es_table_by_id(table_id)
    else:
        formatted_object = table_to_es(table, session=session)
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, table_id, updated_body)

            # update it in vector store as well
            if update_vector_store:
                from logic.vector_store import record_table

                record_table(table=table, session=session)
        except Exception:
            # Otherwise insert as new
            LOG.error("failed to upsert {}. Will pass.".format(table_id))


def delete_es_table_by_id(
    table_id,
):
    index_name = ES_CONFIG["tables"]["index_name"]
    try:
        _delete(index_name, id=table_id)

        # delete it from vector store as well
        from logic.vector_store import delete_table_doc

        delete_table_doc(table_id)
    except Exception:
        LOG.error("failed to delete {}. Will pass.".format(table_id))


"""
    USERS
"""


def process_names_for_suggestion(*args):
    """Process names (remove non alpha chars, lowercase, trim)
       Break each name word and re-insert them in to the array along with the original name
       (ex 'John Smith 123' -> ['John Smith', 'John', 'Smith'] )
    Returns:
        [List[str]] -- a list of words
    """
    words = []
    for name in args:
        name_processed = re.sub(r"[\(\)\\\/0-9]+", "", name or "").strip().lower()
        name_words = name_processed.split()
        words.append(name_processed)
        words += name_words
    return words


@with_session
def user_to_es(user, fields=None, session=None):
    username = user.username or ""
    fullname = user.fullname or ""

    def get_suggestion_field():
        return {
            "input": process_names_for_suggestion(username, fullname),
        }

    def get_fullname_field():
        return (fullname or username) + (" (deactivated)" if user.deleted else "")

    field_to_getter = {
        "id": user.id,
        "username": username,
        "fullname": get_fullname_field,
        "suggest": get_suggestion_field,
    }
    return _get_dict_by_field(field_to_getter, fields=fields)


@with_session
def get_users_iter(batch_size=5000, session=None):
    offset = 0

    while True:
        users = User.get_all(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info("\n--User count: {}, offset: {}".format(len(users), offset))

        for user in users:
            yield user

        if len(users) < batch_size:
            break
        offset += batch_size


def _bulk_insert_users():
    index_name = ES_CONFIG["users"]["index_name"]

    for user in get_users_iter():
        # skip indexing user groups before having the correct permission setup for it.
        if not user.is_group:
            expanded_user = user_to_es(user, fields=None)
            _insert(index_name, expanded_user["id"], expanded_user)


def _bulk_update_users(fields: Set[str] = None):
    index_name = ES_CONFIG["users"]["index_name"]

    for user in get_users_iter():
        expanded_user = user_to_es(user, fields=fields)
        updated_body = {"doc": expanded_user, "doc_as_upsert": True}
        _update(index_name, expanded_user["id"], updated_body)


@with_exception
@with_session
def update_user_by_id(uid, session=None):
    index_name = ES_CONFIG["users"]["index_name"]

    user = User.get(id=uid, session=session)
    if user is None:
        try:
            _delete(index_name, id=uid)
        except Exception:
            LOG.error("failed to delete {}. Will pass.".format(uid))
    else:
        formatted_object = user_to_es(user, session=session)
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, uid, updated_body)
        except Exception:
            LOG.error("failed to upsert {}. Will pass.".format(uid))


"""
    BOARDS
"""


@with_session
def get_boards_iter(batch_size=5000, fields=None, session=None):
    offset = 0

    while True:
        boards = Board.get_all(
            limit=batch_size,
            offset=offset,
            session=session,
        )
        LOG.info("\n--Board count: {}, offset: {}".format(len(boards), offset))

        for board in boards:
            expanded_board = board_to_es(board, fields=fields, session=session)
            yield expanded_board

        if len(boards) < batch_size:
            break
        offset += batch_size


@with_session
def board_to_es(board, fields=None, session=None):
    def get_board_doc_titles():
        return [doc.title for doc in board.docs if doc.title]

    def get_board_table_names():
        table_names = []
        for table in board.tables:
            table_names.append("{}.{}".format(table.data_schema.name, table.name))
        return table_names

    def get_readable_user_ids():
        uids = [board.owner_uid]
        for board_editor in board.editors:
            uids.append(board_editor.uid)
        return uids

    field_to_getter = {
        "id": board.id,
        "title": board.name,
        "environment_id": board.environment_id,
        "description": lambda: richtext_to_plaintext(board.description),
        "public": board.public,
        "owner_uid": board.owner_uid,
        "full_table_name": get_board_table_names,
        "doc_name": get_board_doc_titles,
        "readable_user_ids": get_readable_user_ids,
    }
    return _get_dict_by_field(field_to_getter, fields=fields)


def _bulk_insert_boards():
    index_name = ES_CONFIG["boards"]["index_name"]

    for board in get_boards_iter():
        _insert(index_name, board["id"], board)


def _bulk_update_boards(fields: Set[str] = None):
    index_name = ES_CONFIG["boards"]["index_name"]

    for board in get_boards_iter(fields=fields):
        updated_body = {"doc": board, "doc_as_upsert": True}
        _update(index_name, board["id"], updated_body)


@with_exception
@with_session
def update_board_by_id(board_id, session=None):
    index_name = ES_CONFIG["boards"]["index_name"]

    board = Board.get(id=board_id, session=session)
    if board is None or board.deleted_at is not None:
        try:
            _delete(index_name, id=board_id)
        except Exception:
            LOG.error("failed to delete board {}. Will pass.".format(board_id))
    else:
        formatted_object = board_to_es(board, session=session)
        try:
            # Try to update if present
            updated_body = {
                "doc": formatted_object,
                "doc_as_upsert": True,
            }  # ES requires this format for updates
            _update(index_name, board_id, updated_body)
        except Exception:
            LOG.error("failed to upsert board {}. Will pass.".format(board))


"""
    Elastic Search Utils
"""


def _insert(index_name, id, content):
    get_hosted_es().index(index=index_name, id=id, body=content)


def _delete(index_name, id):
    get_hosted_es().delete(index=index_name, id=id)


def _update(index_name, id, content):
    get_hosted_es().update(index=index_name, id=id, body=content)


def _bulk_insert_index(type_name: str):
    if type_name == "query_executions":
        LOG.info("Inserting query executions")
        _bulk_insert_query_executions()
    elif type_name == "query_cells":
        LOG.info("Inserting query cells")
        _bulk_insert_query_cells()
    elif type_name == "datadocs":
        LOG.info("Inserting datadocs")
        _bulk_insert_datadocs()
    elif type_name == "tables":
        LOG.info("Inserting tables")
        _bulk_insert_tables()
    elif type_name == "users":
        LOG.info("Inserting users")
        _bulk_insert_users()
    elif type_name == "boards":
        LOG.info("Inserting boards")
        _bulk_insert_boards()


def create_indices(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for es_config in es_configs:
        get_hosted_es().indices.create(es_config["index_name"], es_config["mappings"])
        _bulk_insert_index(es_config["type_name"])


def create_indices_if_not_exist(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for es_config in es_configs:
        if not get_hosted_es().indices.exists(index=es_config["index_name"]):
            get_hosted_es().indices.create(
                es_config["index_name"], es_config["mappings"]
            )
            _bulk_insert_index(es_config["type_name"])


def delete_indices(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for es_config in es_configs:
        get_hosted_es().indices.delete(es_config["index_name"])


def get_es_config_by_name(*config_names):
    if len(config_names) == 0:
        config_names = ES_CONFIG.keys()
    return [ES_CONFIG[config_name] for config_name in config_names]


def recreate_indices(*config_names):
    delete_indices(*config_names)
    create_indices_if_not_exist(*config_names)


def update_indices(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for config in es_configs:
        index_name = config["index_name"]
        mapping = config["mappings"]["mappings"]
        get_hosted_es().indices.put_mapping(mapping, index=index_name)


def bulk_update_index_by_fields(config_name, fields):
    es_config = ES_CONFIG[config_name]
    type_name = es_config["type_name"]
    LOG.info(f"Updating {type_name}")
    if type_name == "query_executions":
        _bulk_update_query_executions(fields=fields)
    elif type_name == "query_cells":
        _bulk_update_query_cells(fields=fields)
    elif type_name == "datadocs":
        _bulk_update_datadocs(fields=fields)
    elif type_name == "tables":
        _bulk_update_tables(fields=fields)
    elif type_name == "users":
        _bulk_update_users(fields=fields)
    elif type_name == "boards":
        _bulk_update_boards(fields=fields)
