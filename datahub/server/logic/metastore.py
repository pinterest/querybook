import datetime
from sqlalchemy import func

from app.db import with_session
from const.elasticsearch import ElasticsearchItem
from lib.sqlalchemy import update_model_fields
from lib.query_analysis.lineage import process_query
from models.metastore import (
    DataSchema,
    DataTable,
    DataTableInformation,
    DataTableColumn,
    DataTableOwnership,
    DataTableQueryExecution,
    DataJobMetadata,
    TableLineage,
    DataTableStatistics,
    DataTableColumnStatistics,
)
from models.query_execution import QueryExecution
from tasks.sync_elasticsearch import sync_elasticsearch


@with_session
def get_all_schema(offset=0, limit=100, session=None):
    """Get all the schemas."""
    return session.query(DataSchema).offset(offset).limit(limit).all()


def get_schema_by_name_and_metastore_id(schema_name, metastore_id, session=None):
    """"Get schema by name and metastore id"""
    return (
        session.query(DataSchema)
        .filter(DataSchema.name == schema_name)
        .filter(DataSchema.metastore_id == metastore_id)
        .first()
    )


@with_session
def get_schema_by_id(schema_id, session=None):
    """Get schema by id"""
    return session.query(DataSchema).filter(DataSchema.id == schema_id).first()


@with_session
def update_schema(schema_id, description, session=None):

    schema = get_schema_by_id(schema_id, session=session)

    schema.description = description
    schema.updated_at = datetime.datetime.now()

    session.commit()
    return schema


@with_session
def get_schemas_by_metastore(metastore_id, session=None):
    return (
        session.query(DataSchema).filter(DataSchema.metastore_id == metastore_id).all()
    )


@with_session
def get_schema_by_name(schema_name, metastore_id, session=None):
    """Get schema by name"""
    return (
        session.query(DataSchema)
        .filter_by(metastore_id=metastore_id, name=schema_name)
        .first()
    )


@with_session
def create_schema(
    name=None, table_count=None, description=None, metastore_id=None, session=None
):
    schema = get_schema_by_name(name, metastore_id, session=session)
    new_schema = DataSchema(
        name=name,
        table_count=table_count,
        description=description,
        metastore_id=metastore_id,
    )

    if not schema:
        session.add(new_schema)
    else:
        new_schema.id = schema.id
        session.merge(new_schema)

    session.commit()
    return new_schema


@with_session
def delete_schema(id=None, commit=True, session=None):
    schema = get_schema_by_id(schema_id=id, session=session)
    if not schema:
        return

    session.delete(schema)

    if commit:
        session.commit()
    else:
        session.flush()


def get_all_table(offset=0, limit=100, session=None):
    """Get all the tables."""
    return session.query(DataTable).offset(offset).limit(limit).all()


@with_session
def get_table_by_name(schema_name, name, metastore_id, session=None):
    """Get an table by its name"""
    return (
        session.query(DataTable)
        .join(DataSchema)
        .filter(DataTable.name == name)
        .filter(DataSchema.name == schema_name)
        .filter(DataSchema.metastore_id == metastore_id)
        .first()
    )


@with_session
def get_table_by_schema_id_and_name(schema_id, name, session=None):
    """Get an table by its name"""
    return (
        session.query(DataTable)
        .join(DataSchema)
        .filter(DataSchema.id == schema_id)
        .filter(DataTable.name == name)
        .first()
    )


@with_session
def get_table_by_schema_id(schema_id, session=None):
    """Get an table by its key"""
    return session.query(DataTable).filter(DataTable.schema_id == schema_id).all()


@with_session
def get_table_by_id(table_id, session=None):
    """Get an table by its id"""
    return session.query(DataTable).get(table_id)


@with_session
def create_table(
    name=None,
    type=None,
    owner=None,
    table_created_at=None,
    table_updated_by=None,
    table_updated_at=None,
    data_size_bytes=None,
    location=None,
    column_count=None,
    schema_id=None,
    commit=True,
    session=None,
):
    """ Create a new table row given settings. """
    fields_to_update = {
        "name": name,
        "type": type,
        "owner": owner,
        "table_created_at": datetime.datetime.fromtimestamp(float(table_created_at))
        if table_created_at
        else None,
        "table_updated_by": datetime.datetime.fromtimestamp(float(table_updated_at))
        if table_updated_at
        else None,
        "data_size_bytes": data_size_bytes,
        "location": location,
        "column_count": column_count,
        "schema_id": schema_id,
    }

    table = get_table_by_schema_id_and_name(schema_id, name, session=session)
    should_update_es = True
    if not table:
        table = DataTable(**fields_to_update)
        session.add(table)
    else:
        should_update_es = update_model_fields(
            model=table, skip_if_value_none=True, **fields_to_update
        )
        table.updated_at = datetime.datetime.now()

    if commit:
        session.commit()
        if should_update_es:
            update_es_tables_by_id(table.id)
    else:
        session.flush()

    session.refresh(table)
    return table


@with_session
def update_table(id, golden=None, score=None, commit=True, session=None):
    table = get_table_by_id(id, session=session)
    if not table:
        return

    if golden is not None:
        table.golden = golden

    if score is not None:
        table.boost_score = score

    if commit:
        session.commit()
        update_es_tables_by_id(table.id)
    else:
        session.flush()
    session.refresh(table)
    return table


@with_session
def create_table_information(
    data_table_id=None,
    latest_partitions=None,
    earliest_partitions=None,
    hive_metastore_description=None,
    commit=False,
    session=None,
):
    table_information = get_table_information_by_table_id(
        data_table_id, session=session
    )

    new_table_information = DataTableInformation(
        data_table_id=data_table_id,
        latest_partitions=latest_partitions,
        earliest_partitions=earliest_partitions,
        hive_metastore_description=hive_metastore_description,
    )

    if not table_information:
        session.add(new_table_information)
        table_information = new_table_information
    else:
        new_table_information.id = table_information.id
        session.merge(new_table_information)

    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(table_information)

    return table_information


@with_session
def delete_table(table_id=None, commit=True, session=None):
    table = get_table_by_id(table_id=table_id, session=session)
    if not table:
        return

    session.delete(table)

    if commit:
        session.commit()
        update_es_tables_by_id(table_id)


@with_session
def update_table_information(
    data_table_id=None, description=None, commit=True, session=None
):
    table_information = get_table_information_by_table_id(
        data_table_id, session=session
    )

    if not table_information:
        return

    should_update_es = update_model_fields(
        model=table_information, skip_if_value_none=True, description=description
    )

    if commit:
        session.commit()
        if should_update_es:
            update_es_tables_by_id(data_table_id)

    session.refresh(table_information)
    return table_information


@with_session
def get_table_information_by_table_id(table_id, session=None):
    return (
        session.query(DataTableInformation)
        .filter(DataTableInformation.data_table_id == table_id)
        .first()
    )


@with_session
def get_table_ownership_by_table_id(table_id, session=None):
    return (
        session.query(DataTableOwnership)
        .filter(DataTableOwnership.data_table_id == table_id)
        .first()
    )


@with_session
def create_or_update_table_ownership_by_table_id(
    table_id, owner, commit=True, session=None
):
    table_ownership = get_table_ownership_by_table_id(table_id, session=session)

    if table_ownership:
        # Update
        table_ownership.owner = owner
        table_ownership.created_at = datetime.datetime.now()
    else:
        table_ownership = DataTableOwnership(owner=owner, data_table_id=table_id)
        session.add(table_ownership)

    if commit:
        session.commit()
        update_es_tables_by_id(table_id)
    table_ownership.id
    return table_ownership


@with_session
def get_column_by_name(name, table_id, session=None):
    return (
        session.query(DataTableColumn)
        .filter(DataTableColumn.name == name)
        .filter(DataTableColumn.table_id == table_id)
        .first()
    )


@with_session
def get_column_by_id(column_id, session=None):
    return session.query(DataTableColumn).get(column_id)


@with_session
def get_column_by_table_id(table_id, session=None):
    return (
        session.query(DataTableColumn)
        .filter(DataTableColumn.table_id == table_id)
        .all()
    )


@with_session
def get_all_column_name_by_table_id(table_id, session=None):
    return (
        session.query(DataTableColumn.name)
        .filter(DataTableColumn.table_id == table_id)
        .all()
    )


@with_session
def create_column(
    name=None, type=None, comment=None, table_id=None, commit=True, session=None
):
    old_table_column = get_column_by_name(name, table_id, session=session)
    if old_table_column:
        comment = comment or old_table_column.comment

    new_table_column = DataTableColumn(
        name=name, type=type, comment=comment, table_id=table_id,
    )

    if not old_table_column:
        session.add(new_table_column)
    else:
        new_table_column.id = old_table_column.id
        new_table_column.created_at = old_table_column.created_at
        new_table_column.updated_at = datetime.datetime.now()

        session.merge(new_table_column)

    if commit:
        session.commit()
    else:
        session.flush()
    return new_table_column


@with_session
def update_column_by_id(
    id=None, description=None, commit=True, session=None,
):

    table_column = get_column_by_id(id, session=session)
    if not table_column:
        return

    column_updated = update_model_fields(
        model=table_column, skip_if_value_none=True, description=description
    )

    if column_updated:
        table_column.updated_at = datetime.datetime.now()

        if commit:
            session.commit()
            update_es_tables_by_id(table_column.table_id)
        else:
            session.flush()
        session.refresh(table_column)

    return table_column


@with_session
def delete_column(id=None, commit=True, session=None):
    column = get_column_by_id(column_id=id, session=session)
    if not column:
        return

    table_id = column.table_id
    session.delete(column)

    if commit:
        session.commit()
        update_es_tables_by_id(table_id)
    else:
        session.flush()


@with_session
def create_job_metadata_row(
    job_name,
    metastore_id,
    job_info=None,
    job_owner=None,
    query_text=None,
    is_adhoc=False,
    session=None,
):
    job_metadata = DataJobMetadata(
        job_name=job_name,
        job_info=job_info,
        job_owner=job_owner,
        query_text=query_text,
        is_adhoc=is_adhoc,
        metastore_id=metastore_id,
    )
    session.add(job_metadata)

    session.commit()
    return job_metadata


@with_session
def delete_job_metadata_row(job_name, metastore_id, commit=True, session=None):
    job_metadata = get_job_metadata_by_name(job_name, metastore_id, session=session)

    if not job_metadata:
        return

    session.delete(job_metadata)
    if commit:
        session.commit()
    else:
        session.flush()


@with_session
def get_job_metadata_by_name(job_name, metastore_id, session=None):
    return (
        session.query(DataJobMetadata)
        .filter(DataJobMetadata.job_name == job_name)
        .filter(DataJobMetadata.metastore_id == metastore_id)
        .first()
    )


@with_session
def get_data_job_metadata_by_id(id, session=None):
    return session.query(DataJobMetadata).filter(DataJobMetadata.id == id).first()


@with_session
def iterate_job_metadata(session=None):
    yield from session.query(DataJobMetadata).yield_per(100)


@with_session
def iterate_data_table(session=None):
    yield from session.query(DataTable).yield_per(100)


@with_session
def iterate_data_schema(metastore_id, session=None):
    yield from session.query(DataSchema).filter_by(metastore_id=metastore_id).yield_per(
        100
    )


"""
    ---------------------------------------------------------------------------------------------------------
    DATA LINEAGE
    ---------------------------------------------------------------------------------------------------------
"""


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
                    parent_table = get_table_by_name(
                        source_string[0],
                        source_string[1],
                        job_metadata.metastore_id,
                        session=session,
                    )

                    target_string = lineage["target"].split(".")
                    child_table = get_table_by_name(
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
def get_table_query_examples(table_id, engine_ids, limit=5, offset=0, session=None):
    logs = (
        session.query(DataTableQueryExecution)
        .join(QueryExecution)
        .filter(DataTableQueryExecution.table_id == table_id)
        .filter(QueryExecution.engine_id.in_(engine_ids))
        .order_by(DataTableQueryExecution.id.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

    return logs


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
def get_table_query_samples_count(table_id, session):
    return session.query(DataTableQueryExecution).filter_by(table_id=table_id).count()


"""
    ---------------------------------------------------------------------------------------------------------
    ELASTICSEARCH
    ---------------------------------------------------------------------------------------------------------
"""


def update_es_tables_by_id(id):
    sync_elasticsearch.apply_async(args=[ElasticsearchItem.tables.value, id])


"""
    ---------------------------------------------------------------------------------------------------------
    STATISTICS
    ---------------------------------------------------------------------------------------------------------
"""


def get_table_stat_by_id(table_id, session=None):
    return (
        session.query(DataTableStatistics)
        .filter(DataTableStatistics.table_id == table_id)
        .all()
    )


def create_table_stat(
    table_id, key, value, content_type, uid, commit=True, session=None
):
    table_stat = DataTableStatistics.get(table_id=table_id, key=key, session=session)

    new_table_stat = DataTableStatistics(
        table_id=table_id, key=key, value=value, content_type=content_type, uid=uid
    )

    if table_stat:
        new_table_stat.id = table_stat.id
        session.merge(new_table_stat)
    else:
        session.add(new_table_stat)
        table_stat = new_table_stat

    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(table_stat)

    return table_stat


def get_table_column_stat_by_id(column_id, session=None):
    return (
        session.query(DataTableColumnStatistics)
        .filter(DataTableColumnStatistics.column_id == column_id)
        .all()
    )


def create_table_column_stat(
    column_id, key, value, content_type, uid, commit=True, session=None
):
    column_stat = DataTableColumnStatistics.get(
        column_id=column_id, key=key, session=session
    )

    new_column_stat = DataTableColumnStatistics(
        column_id=column_id, key=key, value=value, content_type=content_type, uid=uid
    )

    if column_stat:
        new_column_stat.id = column_stat.id
        session.merge(new_column_stat)
    else:
        session.add(new_column_stat)
        column_stat = new_column_stat

    if commit:
        session.commit()
    else:
        session.flush()
    session.refresh(column_stat)

    return column_stat
