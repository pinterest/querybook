import datetime

from app.db import with_session
from const.elasticsearch import ElasticsearchItem
from const.metastore import DataOwner, DataTableWarningSeverity
from lib.logger import get_logger
from lib.sqlalchemy import update_model_fields
from logic import data_element as data_element_logic
from logic.user import get_user_by_name
from models.admin import QueryEngineEnvironment
from models.metastore import (
    DataJobMetadata,
    DataSchema,
    DataTable,
    DataTableColumn,
    DataTableColumnStatistics,
    DataTableInformation,
    DataTableOwnership,
    DataTableQueryExecution,
    DataTableStatistics,
    DataTableWarning,
)
from models.query_execution import QueryExecution
from sqlalchemy import and_, func
from sqlalchemy.orm import aliased
from tasks.sync_elasticsearch import sync_elasticsearch

LOG = get_logger(__file__)


@with_session
def get_all_schemas(
    metastore_id,
    offset=0,
    limit=5,
    sort_key="name",
    sort_order="desc",
    name=None,
    session=None,
):
    """Get all the schemas."""
    query = session.query(DataSchema)

    col = getattr(DataSchema, sort_key)

    if sort_order == "desc":
        col = col.desc()

    if name:
        query = query.filter(DataSchema.name.like("%" + name + "%"))

    result = (
        query.order_by(col)
        .filter(DataSchema.metastore_id == metastore_id)
        .offset(offset)
        .limit(limit)
        .all()
    )
    return result


def get_schema_by_name_and_metastore_id(schema_name, metastore_id, session=None):
    """Get schema by name and metastore id"""
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
    name=None,
    table_count=None,
    description=None,
    metastore_id=None,
    commit=True,
    session=None,
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

    if commit:
        session.commit()
    else:
        session.flush()

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
    golden=False,
    boost_score=1,
    commit=True,
    session=None,
):
    """Create a new table row given settings."""
    fields_to_update = {
        "name": name,
        "type": type,
        "owner": owner,
        "table_created_at": (
            datetime.datetime.fromtimestamp(float(table_created_at))
            if table_created_at
            else None
        ),
        "table_updated_at": (
            datetime.datetime.fromtimestamp(float(table_updated_at))
            if table_updated_at
            else None
        ),
        "table_updated_by": table_updated_by,
        "data_size_bytes": data_size_bytes,
        "location": location,
        "column_count": column_count,
        "schema_id": schema_id,
        "golden": golden,
        "boost_score": boost_score,
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
    description=None,
    latest_partitions=None,
    earliest_partitions=None,
    hive_metastore_description=None,
    partition_keys=[],
    custom_properties=None,
    table_links=None,
    commit=False,
    session=None,
):
    table_information = get_table_information_by_table_id(
        data_table_id, session=session
    )

    column_infomation = None
    if partition_keys:
        column_infomation = {"partition_keys": partition_keys}

    new_table_information = DataTableInformation(
        data_table_id=data_table_id,
        latest_partitions=latest_partitions,
        earliest_partitions=earliest_partitions,
        hive_metastore_description=hive_metastore_description,
        column_info=column_infomation,
        custom_properties=custom_properties,
        table_links=table_links,
    )

    # The reason that we dont add description direclty in
    # DataTableInformation() above is because it's optional.
    # Otherwise, for those existing metastores which dont sync description
    # to querybook, it will wipe out the existing description.
    if description is not None:
        new_table_information.description = description

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
def create_table_warnings(
    table_id,
    warnings: tuple[DataTableWarningSeverity, str] = [],
    commit=False,
    session=None,
):
    """This function is used for loading table warnings from metastore.

    For warnings from metastore, created_by will be None.
    """
    # delete all warnings without created_by from the table
    session.query(DataTableWarning).filter_by(
        table_id=table_id, created_by=None
    ).delete()

    # add warnings from metastore to the table
    for severity, message in warnings:
        DataTableWarning.create(
            {
                "message": message,
                "severity": severity,
                "table_id": table_id,
            },
            commit=False,
            session=session,
        )
    if commit:
        session.commit()
    else:
        session.flush()


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
def get_all_table_ownerships_by_table_id(table_id, session=None):
    return (
        session.query(DataTableOwnership)
        .filter(DataTableOwnership.data_table_id == table_id)
        .all()
    )


@with_session
def get_table_ownership(table_id, uid, session=None):
    return (
        session.query(DataTableOwnership)
        .filter(DataTableOwnership.data_table_id == table_id)
        .filter(DataTableOwnership.uid == uid)
        .first()
    )


@with_session
def create_table_ownership(table_id, uid, commit=True, session=None):
    table_ownership = get_table_ownership(table_id=table_id, uid=uid, session=session)

    if table_ownership:
        return

    table_ownership = DataTableOwnership(data_table_id=table_id, uid=uid)
    session.add(table_ownership)

    if commit:
        session.commit()
        update_es_tables_by_id(table_id)
    table_ownership.id
    return table_ownership


@with_session
def create_table_ownerships(
    table_id: int, owners: list[DataOwner] = [], commit=True, session=None
):
    """This function is used for loading owners from metastore."""
    # delete all the ownerships of the table first
    session.query(DataTableOwnership).filter_by(data_table_id=table_id).delete()

    for owner in owners:
        user = get_user_by_name(owner.username, session=session)
        if not user:
            LOG.error(
                f"Failed to find user or group: {owner} when loading table owners."
            )
            continue
        # add table ownership
        table_ownership = DataTableOwnership(
            data_table_id=table_id, uid=user.id, type=owner.type
        )
        session.add(table_ownership)

    if commit:
        session.commit()
    else:
        session.flush()


@with_session
def delete_table_ownership(table_id, uid, commit=True, session=None):
    table_ownership = get_table_ownership(table_id=table_id, uid=uid, session=session)

    if not table_ownership:
        return

    session.delete(table_ownership)

    if commit:
        session.commit()
        update_es_tables_by_id(table_id)
    else:
        session.flush()


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
def get_detailed_column_dict(column: DataTableColumn, with_table=False, session=None):
    from logic import tag as tag_logic

    column_dict = column.to_dict(with_table)
    column_dict["stats"] = DataTableColumnStatistics.get_all(
        column_id=column.id, session=session
    )
    column_dict["tags"] = tag_logic.get_tags_by_column_id(
        column_id=column.id, session=session
    )
    column_dict[
        "data_element_association"
    ] = data_element_logic.get_data_element_association_by_column_id(
        column.id, session=session
    )
    return column_dict


@with_session
def get_detailed_columns_dict_by_table_id(table_id, session=None):
    data_table_columns = (
        session.query(DataTableColumn)
        .filter(DataTableColumn.table_id == table_id)
        .all()
    )
    columns_info = []
    for col in data_table_columns:
        columns_info.append(get_detailed_column_dict(col, session=session))
    return columns_info


@with_session
def get_all_column_name_by_table_id(table_id, session=None):
    return (
        session.query(DataTableColumn.name)
        .filter(DataTableColumn.table_id == table_id)
        .all()
    )


@with_session
def create_column(
    name=None,
    type=None,
    comment=None,
    description=None,
    table_id=None,
    commit=True,
    session=None,
):
    old_table_column = get_column_by_name(name, table_id, session=session)
    if old_table_column:
        comment = comment or old_table_column.comment

    new_table_column = DataTableColumn(
        name=name,
        type=type,
        comment=comment,
        table_id=table_id,
    )

    if description is not None:
        new_table_column.description = description

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
    id=None,
    description=None,
    commit=True,
    session=None,
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
def delete_old_table_query_execution_log(
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
    table_id,
    engine_ids,
    uid=None,
    engine_id=None,
    with_table_id=None,
    limit=5,
    offset=0,
    session=None,
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

    if engine_id is not None:
        query = query.filter(QueryExecution.engine_id == engine_id)

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
def get_query_example_engines(table_id, environment_id, session=None):
    engines = (
        session.query(QueryExecution.engine_id, func.count(QueryExecution.id))
        .select_from(DataTableQueryExecution)
        .join(QueryExecution)
        .join(
            QueryEngineEnvironment,
            QueryExecution.engine_id == QueryEngineEnvironment.query_engine_id,
        )
        .filter(DataTableQueryExecution.table_id == table_id)
        .filter(QueryEngineEnvironment.environment_id == environment_id)
        .group_by(QueryExecution.engine_id)
        .order_by(func.count(QueryExecution.id).desc())
        .all()
    )

    return engines


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


@with_session
def get_tables_by_query_execution_id(query_execution_id, session=None):
    return (
        session.query(DataTable)
        .join(DataTableQueryExecution)
        .filter(DataTableQueryExecution.query_execution_id == query_execution_id)
        .all()
    )


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


@with_session
def upsert_table_stat(table_id, key, value, uid=None, commit=True, session=None):
    table_stat = DataTableStatistics.get(table_id=table_id, key=key, session=session)

    new_table_stat = DataTableStatistics(
        table_id=table_id, key=key, value=value, uid=uid
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


@with_session
def upsert_table_column_stat(
    column_id, key, value, uid=None, commit=True, session=None
):
    column_stat = DataTableColumnStatistics.get(
        column_id=column_id, key=key, session=session
    )

    new_column_stat = DataTableColumnStatistics(
        column_id=column_id, key=key, value=value, uid=uid
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
