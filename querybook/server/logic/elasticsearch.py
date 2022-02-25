from html import escape
from itertools import chain
import math
import re

from const.impression import ImpressionItemType
from const.query_execution import QueryExecutionStatus
from env import QuerybookSettings
from elasticsearch import Elasticsearch, RequestsHttpConnection
from lib.query_analysis.lineage import get_table_statement_type, process_query

from lib.utils.utils import (
    DATETIME_TO_UTC,
    with_exception,
)
from lib.utils.decorators import in_mem_memoized
from lib.logger import get_logger
from lib.config import get_config_value
from lib.richtext import richtext_to_plaintext
from app.db import with_session
from logic.admin import get_query_engine_by_id
from logic.datadoc import (
    get_all_data_docs,
    get_all_query_cells,
    get_data_cell_by_query_execution_id,
    get_data_doc_by_id,
    get_data_doc_editors_by_doc_id,
    get_unarchived_query_cell_by_id,
)
from logic.metastore import (
    get_all_table,
    get_table_by_id,
    get_table_query_samples_count,
)

from logic.impression import (
    get_viewers_count_by_item_after_date,
    get_last_impressions_date,
)
from logic.query_execution import (
    get_successful_adhoc_query_executions,
    get_query_execution_by_id,
    get_successful_query_executions_by_data_cell_id,
)
from models.user import User
from models.datadoc import DataCellType


LOG = get_logger(__file__)
ES_CONFIG = get_config_value("elasticsearch")


@in_mem_memoized(3600)
def get_hosted_es():
    hosted_es = None

    if QuerybookSettings.ELASTICSEARCH_CONNECTION_TYPE == "naive":
        hosted_es = Elasticsearch(hosts=QuerybookSettings.ELASTICSEARCH_HOST)
    elif QuerybookSettings.ELASTICSEARCH_CONNECTION_TYPE == "aws":

        # TODO: generialize aws region setup
        from boto3 import session as boto_session
        from lib.utils.assume_role_aws4auth import AssumeRoleAWS4Auth

        credentials = boto_session.Session().get_credentials()
        auth = AssumeRoleAWS4Auth(credentials, QuerybookSettings.AWS_REGION, "es",)
        hosted_es = Elasticsearch(
            hosts=QuerybookSettings.ELASTICSEARCH_HOST,
            http_auth=auth,
            connection_class=RequestsHttpConnection,
            use_ssl=True,
            verify_certs=True,
        )
    return hosted_es


"""
    QUERY EXECUTIONS
"""


@with_session
def _get_query_cell_executions_iter(batch_size=1000, session=None):
    offset = 0
    while True:
        query_cells = get_all_query_cells(
            limit=batch_size, offset=offset, session=session,
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
                        query_execution, data_cell=query_cell, session=session,
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
def _get_adhoc_query_executions_iter(batch_size=1000, session=None):
    offset = 0
    while True:
        query_executions = get_successful_adhoc_query_executions(
            limit=batch_size, offset=offset, session=session,
        )
        LOG.info(
            "\n--Adhoc query executions count: {}, offset: {}".format(
                len(query_executions), offset
            )
        )

        for query_execution in query_executions:
            expand_query_execution = query_execution_to_es(
                query_execution, session=session
            )
            yield expand_query_execution

        if len(query_executions) < batch_size:
            break
        offset += batch_size


@with_session
def get_query_executions_iter(batch_size=1000, session=None):
    yield from _get_query_cell_executions_iter(batch_size=batch_size, session=session)
    yield from _get_adhoc_query_executions_iter(batch_size=batch_size, session=session)


@with_session
def query_execution_to_es(query_execution, data_cell=None, session=None):
    """data_cell is added as a parameter so that bulk insert of query executions won't require
    re-retrieval of data_cell"""
    query_execution_id = query_execution.id

    engine_id = query_execution.engine_id
    engine = get_query_engine_by_id(engine_id, session=session)

    table_names, _ = process_query(
        query_execution.query, language=(engine and engine.language)
    )
    table_names = list(chain.from_iterable(table_names))

    duration = (
        DATETIME_TO_UTC(query_execution.completed_at)
        - DATETIME_TO_UTC(query_execution.created_at)
        if query_execution.completed_at is not None
        else None
    )

    environments = engine.environments
    environment_ids = [env.id for env in environments]

    title = data_cell.meta.get("title", "Untitled") if data_cell else None

    expand_query_execution = {
        "id": query_execution_id,
        "query_type": "query_execution",
        "title": title,
        "environment_id": environment_ids,
        "author_uid": query_execution.uid,
        "engine_id": engine_id,
        "statement_type": get_table_statement_type(query_execution.query),
        "created_at": DATETIME_TO_UTC(query_execution.created_at),
        "duration": duration,
        "full_table_name": table_names,
        "query_text": query_execution.query,
    }
    return expand_query_execution


@with_exception
def _bulk_insert_query_executions():
    index_name = ES_CONFIG["query_executions"]["index_name"]

    for query_execution in get_query_executions_iter():
        _insert(index_name, query_execution["id"], query_execution)


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
def get_query_cells_iter(batch_size=1000, session=None):
    offset = 0

    while True:
        query_cells = get_all_query_cells(
            limit=batch_size, offset=offset, session=session,
        )
        LOG.info(
            "\n--Query cells count: {}, offset: {}".format(len(query_cells), offset)
        )

        for query_cell in query_cells:
            expand_query_cell = query_cell_to_es(query_cell, session=session)
            yield expand_query_cell

        if len(query_cells) < batch_size:
            break
        offset += batch_size


@with_session
def query_cell_to_es(query_cell, session=None):
    query_cell_id = query_cell.id
    query_cell_meta = query_cell.meta

    engine_id = query_cell_meta.get("engine")
    engine = get_query_engine_by_id(engine_id, session=session)

    query = query_cell.context
    table_names, _ = process_query(query, language=(engine and engine.language))
    table_names = list(chain.from_iterable(table_names))

    datadoc = query_cell.doc

    expand_query = {
        "id": query_cell_id,
        "query_type": "query_cell",
        "title": query_cell_meta.get("title", "Untitled"),
        "data_doc_id": datadoc and datadoc.id,
        "environment_id": datadoc and datadoc.environment_id,
        "author_uid": datadoc and datadoc.owner_uid,
        "engine_id": engine_id,
        "statement_type": get_table_statement_type(query),
        "created_at": DATETIME_TO_UTC(query_cell.created_at),
        "full_table_name": table_names,
        "query_text": query,
    }
    return expand_query


@with_exception
def _bulk_insert_query_cells():
    index_name = ES_CONFIG["query_cells"]["index_name"]

    for query_cell in get_query_cells_iter():
        _insert(index_name, query_cell["id"], query_cell)


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


"""
    DATA DOCS
"""


@with_session
def get_datadocs_iter(batch_size=5000, session=None):
    offset = 0

    while True:
        data_docs = get_all_data_docs(limit=batch_size, offset=offset, session=session,)
        LOG.info("\n--Datadocs count: {}, offset: {}".format(len(data_docs), offset))

        for data_doc in data_docs:
            expand_datadoc = datadocs_to_es(data_doc, session=session)
            yield expand_datadoc

        if len(data_docs) < batch_size:
            break
        offset += batch_size


@with_session
def datadocs_to_es(datadoc, session=None):
    title = datadoc.title

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

    # There is no need to compute the list of editors
    # for public datadoc since everyone is able to see it
    editors = (
        [
            editor.uid
            for editor in get_data_doc_editors_by_doc_id(
                data_doc_id=datadoc.id, session=session
            )
        ]
        if not datadoc.public
        else []
    )
    expand_datadoc = {
        "id": datadoc.id,
        "environment_id": datadoc.environment_id,
        "owner_uid": datadoc.owner_uid,
        "created_at": DATETIME_TO_UTC(datadoc.created_at),
        "cells": joined_cells,
        "title": title,
        "public": datadoc.public,
        "readable_user_ids": editors,
    }
    return expand_datadoc


@with_exception
def _bulk_insert_datadocs():
    index_name = ES_CONFIG["datadocs"]["index_name"]

    for datadoc in get_datadocs_iter():
        _insert(index_name, datadoc["id"], datadoc)


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
def get_tables_iter(batch_size=5000, session=None):
    offset = 0

    while True:
        tables = get_all_table(limit=batch_size, offset=offset, session=session,)
        LOG.info("\n--Table count: {}, offset: {}".format(len(tables), offset))

        for table in tables:
            expand_table = table_to_es(table, session=session)
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
    return int(math.log2(((num_impressions + num_samples * 10) + 1) * boost_score))


@with_session
def table_to_es(table, session=None):
    schema = table.data_schema

    column_names = [c.name for c in table.columns]
    schema_name = schema.name
    table_name = table.name
    description = (
        richtext_to_plaintext(table.information.description, escape=True)
        if table.information
        else ""
    )

    full_name = "{}.{}".format(schema_name, table_name)
    weight = get_table_weight(table.id, session=session)

    expand_table = {
        "id": table.id,
        "metastore_id": schema.metastore_id,
        "schema": schema_name,
        "name": table_name,
        "full_name": full_name,
        "full_name_ngram": full_name,
        "completion_name": {
            "input": [full_name, table_name,],
            "weight": weight,
            "contexts": {"metastore_id": schema.metastore_id,},
        },
        "description": description,
        "created_at": DATETIME_TO_UTC(table.created_at),
        "columns": column_names,
        "golden": table.golden,
        "importance_score": weight,
        "tags": [tag.tag_name for tag in table.tags],
    }
    return expand_table


def _bulk_insert_tables():
    index_name = ES_CONFIG["tables"]["index_name"]

    for table in get_tables_iter():
        _insert(index_name, table["id"], table)


@with_exception
@with_session
def update_table_by_id(table_id, session=None):
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
        except Exception:
            # Otherwise insert as new
            LOG.error("failed to upsert {}. Will pass.".format(table_id))


def delete_es_table_by_id(table_id,):
    index_name = ES_CONFIG["tables"]["index_name"]
    try:
        _delete(index_name, id=table_id)
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
def user_to_es(user, session=None):
    username = user.username or ""
    fullname = user.fullname or ""

    return {
        "id": user.id,
        "username": username,
        "fullname": fullname,
        "suggest": {"input": process_names_for_suggestion(username, fullname),},
    }


@with_session
def get_users_iter(batch_size=5000, session=None):
    offset = 0

    while True:
        users = User.get_all(limit=batch_size, offset=offset, session=session,)
        LOG.info("\n--User count: {}, offset: {}".format(len(users), offset))

        for user in users:
            expanded_user = user_to_es(user, session=session)
            yield expanded_user

        if len(users) < batch_size:
            break
        offset += batch_size


def _bulk_insert_users():
    index_name = ES_CONFIG["users"]["index_name"]

    for user in get_users_iter():
        _insert(index_name, user["id"], user)


@with_exception
@with_session
def update_user_by_id(uid, session=None):
    index_name = ES_CONFIG["users"]["index_name"]

    user = User.get(id=uid, session=session)
    if user is None or user.deleted:
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
    Elastic Search Utils
"""


def _insert(index_name, id, content):
    get_hosted_es().index(index=index_name, id=id, body=content)


def _delete(index_name, id):
    get_hosted_es().delete(index=index_name, id=id)


def _update(index_name, id, content):
    get_hosted_es().update(index=index_name, id=id, body=content)


def create_indices(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for es_config in es_configs:
        get_hosted_es().indices.create(es_config["index_name"], es_config["mappings"])

    LOG.info("Inserting query executions")
    _bulk_insert_query_executions()

    LOG.info("Inserting query cells")
    _bulk_insert_query_cells()

    LOG.info("Inserting datadocs")
    _bulk_insert_datadocs()

    LOG.info("Inserting tables")
    _bulk_insert_tables()

    LOG.info("Inserting users")
    _bulk_insert_users()


def create_indices_if_not_exist(*config_names):
    es_configs = get_es_config_by_name(*config_names)
    for es_config in es_configs:
        if not get_hosted_es().indices.exists(index=es_config["index_name"]):
            get_hosted_es().indices.create(
                es_config["index_name"], es_config["mappings"]
            )
            if es_config["type_name"] == "query_executions":
                LOG.info("Inserting query executions")
                _bulk_insert_query_executions()
            elif es_config["type_name"] == "query_cells":
                LOG.info("Inserting query cells")
                _bulk_insert_query_cells()
            elif es_config["type_name"] == "datadocs":
                LOG.info("Inserting datadocs")
                _bulk_insert_datadocs()
            elif es_config["type_name"] == "tables":
                LOG.info("Inserting tables")
                _bulk_insert_tables()
            elif es_config["type_name"] == "users":
                LOG.info("Inserting users")
                _bulk_insert_users()


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
