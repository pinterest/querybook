from app.db import with_session
from lib.query_analysis.lineage import process_query
from models.metastore import (
    DataJobMetadata,
    TableLineage,
)
from logic import metastore


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
