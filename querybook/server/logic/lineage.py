from sqlalchemy import func, and_
from sqlalchemy.orm import aliased

from app.db import with_session
from lib.query_analysis.lineage import process_query
from models.metastore import (
    DataTableQueryExecution,
    DataJobMetadata,
    TableLineage,
)
from models.query_execution import QueryExecution

from logic import metastore

@with_session
def get_all_table_lineages(session=None):
    db_dumps = session.query(TableLineage).all()
    return db_dumps


@with_session
def create_table_lineage_from_metadata(
    job_metadata_id, query_language=None, session=None
):
    job_metadata = session.query(DataJobMetadata).get(job_metadata_id)
    if job_metadata is None:
        return

    _, lineage_per_statement = process_query(job_metadata.query_text, query_language)

    lineage_ids = []
    for statement_lineage in lineage_per_statement:
        if len(statement_lineage):
            for lineage in statement_lineage:
                if "source" in lineage:
                    source_string = lineage["source"].split(".")
                    parent_table = metastore.get_table_by_name(
                        source_string[0],
                        source_string[1],
                        job_metadata.metastore_id,
                        session=session,
                    )

                    target_string = lineage["target"].split(".")
                    child_table = metastore.get_table_by_name(
                        target_string[0],
                        target_string[1],
                        job_metadata.metastore_id,
                        session=session,
                    )

                    if parent_table and child_table:
                        lineage_ids.append(
                            add_table_lineage(
                                child_table.id,
                                parent_table.id,
                                job_metadata_id,
                                session=session,
                            ).id
                        )

    return lineage_ids


@with_session
def add_table_lineage(
    table_id, parent_table_id, job_metadata_id, commit=True, session=None
):
    table_lineage = TableLineage(
        table_id=table_id,
        parent_table_id=parent_table_id,
        job_metadata_id=job_metadata_id,
    )
    session.add(table_lineage)
    if commit:
        session.commit()
        table_lineage.id
    # FIXME: not sure why we need this but new data cannot be added to DB without it
    session.flush()
    return table_lineage


@with_session
def get_table_parent_lineages(table_id, session=None):
    parent_lineages = (
        session.query(TableLineage).filter(TableLineage.table_id == table_id).all()
    )
    return parent_lineages


@with_session
def get_table_child_lineages(table_id, session=None):
    child_lineages = (
        session.query(TableLineage)
        .filter(TableLineage.parent_table_id == table_id)
        .all()
    )
    return child_lineages


@with_session
def create_table_query_execution_log(
    table_id, cell_id, query_execution_id, commit=True, session=None
):
    return DataTableQueryExecution.create(
        fields={
            "table_id": table_id,
            "cell_id": cell_id,
            "query_execution_id": query_execution_id,
        },
        commit=commit,
        session=session,
    )


@with_session
def delete_old_able_query_execution_log(
    cell_id, query_execution_id, commit=True, session=None
):
    session.query(DataTableQueryExecution).filter(
        DataTableQueryExecution.cell_id == cell_id
    ).filter(DataTableQueryExecution.query_execution_id < query_execution_id).delete()

    if commit:
        session.commit()
    else:
        session.flush()


@with_session
def get_table_query_examples(
    table_id, engine_ids, uid=None, with_table_id=None, limit=5, offset=0, session=None
):
    main_table_qe = aliased(DataTableQueryExecution)
    query = (
        session.query(main_table_qe)
        .join(QueryExecution)
        .filter(main_table_qe.table_id == table_id)
        .filter(QueryExecution.engine_id.in_(engine_ids))
    )

    if uid is not None:
        query = query.filter(QueryExecution.uid == uid)

    if with_table_id is not None:
        join_table_qe = aliased(DataTableQueryExecution)
        query = query.join(
            join_table_qe,
            and_(
                main_table_qe.id != join_table_qe.id,
                main_table_qe.query_execution_id == join_table_qe.query_execution_id,
            ),
        ).filter(join_table_qe.table_id == with_table_id)

    return query.order_by(main_table_qe.id.desc()).limit(limit).offset(offset).all()


@with_session
def get_query_example_users(table_id, engine_ids, limit=5, session=None):
    users = (
        session.query(QueryExecution.uid, func.count(QueryExecution.id))
        .select_from(DataTableQueryExecution)
        .join(QueryExecution)
        .filter(DataTableQueryExecution.table_id == table_id)
        .filter(QueryExecution.engine_id.in_(engine_ids))
        .group_by(QueryExecution.uid)
        .order_by(func.count(QueryExecution.id).desc())
        .limit(limit)
        .all()
    )

    return users


@with_session
def get_query_example_concurrences(table_id, limit=5, session=None):
    main_table_qe = aliased(DataTableQueryExecution)
    join_table_qe = aliased(DataTableQueryExecution)

    concurrences = (
        session.query(join_table_qe.table_id, func.count(join_table_qe.id))
        .select_from(main_table_qe)
        .join(
            join_table_qe,
            and_(
                main_table_qe.id != join_table_qe.id,
                main_table_qe.query_execution_id == join_table_qe.query_execution_id,
            ),
        )
        .filter(main_table_qe.table_id == table_id)
        .group_by(join_table_qe.table_id)
        .order_by(func.count(join_table_qe.id).desc())
        .limit(limit)
        .all()
    )

    return concurrences


@with_session
def get_table_query_samples_count(table_id, session):
    return session.query(DataTableQueryExecution).filter_by(table_id=table_id).count()