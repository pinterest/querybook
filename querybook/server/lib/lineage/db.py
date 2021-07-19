from app.db import with_session
from logic import lineage


@with_session
def create_table_lineage_from_metadata(
    job_metadata_id, query_language=None, session=None
):
    lineage.create_table_lineage_from_metadata(
        job_metadata_id, query_language=query_language, session=session
    )


@with_session
def add_table_lineage(
    table_id, parent_table_id, job_metadata_id, commit=True, session=None
):
    return lineage.add_table_lineage(
        table_id, parent_table_id, job_metadata_id, commit=commit, session=session
    )


@with_session
def get_table_parent_lineages(table_id, session=None):
    return lineage.get_table_parent_lineages(table_id, session=session)


@with_session
def get_table_child_lineages(table_id, session=None):
    return lineage.get_table_child_lineages(table_id, session=session)
