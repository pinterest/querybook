from typing import Tuple, Union

from app.auth.permission import (
    verify_data_column_permission,
    verify_data_schema_permission,
    verify_data_table_permission,
    verify_environment_permission,
    verify_metastore_permission,
    verify_query_engine_environment_permission,
)
from app.datasource import admin_only, api_assert, register, with_impression
from app.db import DBSession
from app.flask_app import cache, limiter
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from const.impression import ImpressionItemType
from const.metastore import DataTableWarningSeverity, MetadataType
from const.time import seconds_in_a_day
from flask_login import current_user
from lib.lineage.utils import lineage
from lib.metastore import get_metastore_loader
from lib.metastore.utils import DataTableFinder
from lib.query_analysis.samples import make_samples_query
from lib.utils import mysql_cache
from logic import admin as admin_logic
from logic import metastore as logic
from models.metastore import DataTableStatistics, DataTableWarning
from tasks.run_sample_query import run_sample_query


@register("/query_metastore/", methods=["GET"])
def get_all_query_metastores(
    environment_id,
):
    verify_environment_permission([environment_id])
    metastores = admin_logic.get_all_query_metastore_by_environment(environment_id)
    return [m.to_dict(with_flags=True) for m in metastores]


@register("/schema/<int:schema_id>/", methods=["PUT"])
def update_schema(schema_id, description):
    """Update a schema"""
    with DBSession() as session:
        schema = logic.update_schema(schema_id, description, session=session)

    return schema


@register("/schema/<int:schema_id>/", methods=["GET"])
@cache.memoize(14400)
def get_schema(schema_id, include_metastore=False, include_table=False):
    with DBSession() as session:
        schema = logic.get_schema_by_id(schema_id, session=session)
        api_assert(schema, "Invalid schema")
        verify_metastore_permission(schema.metastore_id, session=session)

        schema_dict = schema.to_dict(include_metastore, include_table)
        return schema_dict


@register("/schema/<int:schema_id>/table/", methods=["GET"])
def get_tables_from_schema(schema_id):
    with DBSession() as session:
        verify_data_schema_permission(schema_id, session=session)
        return logic.get_table_by_schema_id(schema_id, session=session)


@register("/table/<int:table_id>/", methods=["GET"])
@with_impression("table_id", ImpressionItemType.DATA_TABLE)
def get_table(table_id, with_schema=True, with_column=True, with_warnings=True):
    # username = flask_session['uid']
    with DBSession() as session:
        table = logic.get_table_by_id(table_id, session=session)
        api_assert(
            table,
            "Table doesn't exist or has been deleted from Metastore",
            status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
        )
        verify_data_schema_permission(table.schema_id, session=session)
        result = table.to_dict(with_schema, with_column, with_warnings)
        return result


@register("/table/<int:table_id>/metastore_link/", methods=["GET"])
def get_table_metastore_link(
    table_id,
    metadata_type,
):
    verify_data_table_permission(table_id)

    table = logic.get_table_by_id(table_id)
    schema = table.data_schema
    metastore_id = schema.metastore_id
    metastore_loader = get_metastore_loader(metastore_id)

    return metastore_loader.get_table_metastore_link(
        metadata_type=MetadataType(metadata_type),
        schema_name=schema.name,
        table_name=table.name,
    )


@register("/table_name/<schema_name>/<table_name>/", methods=["GET"])
def get_table_by_name(
    schema_name,
    table_name,
    metastore_id,
    with_schema=True,
    with_column=True,
    with_warnings=True,
):
    with DBSession() as session:
        table = logic.get_table_by_name(
            schema_name, table_name, metastore_id, session=session
        )
        api_assert(table, "{}.{} does not exist".format(schema_name, table_name))
        verify_data_schema_permission(table.schema_id, session=session)
        table_dict = table.to_dict(with_schema, with_column, with_warnings)

    return table_dict


@register("/table_name/<schema_name>/<table_name>/exists/", methods=["GET"])
def get_if_schema_and_table_exists(
    metastore_id, schema_name, table_name
) -> Tuple[bool, bool]:
    """
    Check if the table name / schema name exists in cache, then check the actual metastore
    if they don't exist

    Returns [schema_exists, table_exists]
    """
    verify_metastore_permission(metastore_id)
    with DataTableFinder(metastore_id) as t_finder:
        table_exists_in_cache = t_finder.get_table_by_name(schema_name, table_name)
        if table_exists_in_cache:
            return [True, True]

        metastore_loader = get_metastore_loader(metastore_id)
        table_exists = metastore_loader.check_if_table_exists(schema_name, table_name)
        if table_exists:
            return [True, True]

        schema_exists_in_cache = t_finder.get_schema_by_name(schema_name)
        if schema_exists_in_cache:
            return [True, False]

        schema_exists = metastore_loader.check_if_schema_exists(schema_name)
        if schema_exists:
            return [True, False]

    return [False, False]


@register("/data_job_metadata/<int:data_job_metadata_id>/", methods=["GET"])
def get_data_job_metadata(data_job_metadata_id):
    with DBSession() as session:
        # TODO: add some kind of permission check here
        return logic.get_data_job_metadata_by_id(data_job_metadata_id, session=session)


@register("/data_job_metadata/", methods=["POST"])
@admin_only
def add_data_job_metadata(
    job_name, job_info, job_owner, query_text, is_adhoc, metastore_id
):
    with DBSession() as session:
        logic.delete_job_metadata_row(job_name, metastore_id, session=session)
        data_job_metadata = logic.create_job_metadata_row(
            job_name,
            metastore_id,
            job_info,
            job_owner,
            query_text,
            is_adhoc,
            session=session,
        )
        table_lineage_ids = None
        if query_text:
            table_lineage_ids = lineage.create_table_lineage_from_metadata(
                data_job_metadata.id
            )
        return {
            "data_job_metadata_ids": data_job_metadata.id,
            "table_lineage_ids": table_lineage_ids,
        }


@register("/table/<int:table_id>/", methods=["PUT"])
def update_table(table_id, description=None, golden=None):
    """Update a table"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        if description:
            logic.update_table_information(
                table_id, description=description, session=session
            )
        if golden is not None:
            api_assert(
                current_user.is_admin, "Golden table can only be updated by Admin"
            )
            logic.update_table(table_id, golden=golden, session=session)

        return logic.get_table_by_id(table_id, session=session)


@register("/table/<int:table_id>/ownership/", methods=["GET"])
def get_all_table_ownerships_by_table_id(table_id):
    """Add all table ownerships"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)

        return logic.get_all_table_ownerships_by_table_id(
            table_id=table_id, session=session
        )


@register("/table/<int:table_id>/ownership/", methods=["POST"])
def create_table_ownership(table_id):
    """Add a table ownership"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.create_table_ownership(
            table_id=table_id, uid=current_user.id, session=session
        )


@register("/table/<int:table_id>/refresh/", methods=["PUT"])
def sync_table_by_table_id(table_id):
    """Refetch table info from metastore
    It returns None if the table gets deleted.
    Otherwise, it will return the updated table.
    """
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)

        table = logic.get_table_by_id(table_id, session=session)
        schema = table.data_schema

        metastore_id = schema.metastore_id
        metastore_loader = get_metastore_loader(metastore_id, session=session)
        table_id = metastore_loader.sync_table(schema.name, table.name, session=session)
        if table_id == -1:
            return None

        session.refresh(table)
        return table


@register("/table/<int:table_id>/ownership/", methods=["DELETE"])
def remove_table_ownership(table_id):
    """Remove a table ownership"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.delete_table_ownership(
            table_id=table_id, uid=current_user.id, session=session
        )


@register("/table/<int:table_id>/column/", methods=["GET"])
def get_columns_from_table(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.get_column_by_table_id(table_id, session=session)


@register("/table/<int:table_id>/detailed_column/", methods=["GET"])
def get_detailed_columns_from_table(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.get_detailed_columns_dict_by_table_id(table_id, session=session)


@register("/table/<int:table_id>/raw_samples_query/", methods=["GET"])
def get_table_samples_raw_query(
    table_id,
    partition=None,
    where=None,
    order_by=None,
    order_by_asc=True,
    limit=100,
):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return make_samples_query(
            table_id,
            limit=limit,
            partition=partition,
            where=where,
            order_by=order_by,
            order_by_asc=order_by_asc,
            session=session,
        )


@register("/table/<int:table_id>/samples/", methods=["POST"])
def create_table_samples(
    table_id,
    environment_id,
    engine_id,
    partition=None,
    where=None,
    order_by=None,
    order_by_asc=True,
    limit=100,
):
    with DBSession() as session:
        api_assert(limit <= 100, "Too many rows requested")
        verify_environment_permission([environment_id])
        verify_data_table_permission(table_id, session=session)
        verify_query_engine_environment_permission(
            engine_id, environment_id, session=session
        )

        task = run_sample_query.apply_async(
            args=[
                table_id,
                engine_id,
                current_user.id,
                limit,
                partition,
                where,
                order_by,
                order_by_asc,
            ]
        )
        return task.task_id


@register("/table/<int:table_id>/samples/poll/", methods=["GET"])
def poll_table_samples(table_id, task_id) -> Tuple[bool, Union[str, None], int]:
    """Poll the sample query status

    Args:
        table_id (int): Ignored
        task_id (int): Celery task id

    Returns:
        Tuple[bool, Union[str, None], int]: length 3 tuple [Completed, Failed Message, Progress]
    """
    task = run_sample_query.AsyncResult(task_id)
    if task is not None:
        if task.ready():
            failed_message = str(task.result) if task.failed() else None
            return [True, failed_message, 100]

        progress = 0
        if task.info is not None:
            progress = task.info if isinstance(task.info, (float, int)) else 0
        return [False, None, progress]

    return None


@register("/table/<int:table_id>/samples/", methods=["GET"])
def get_table_samples(table_id, environment_id):
    try:
        with DBSession() as session:
            verify_environment_permission([environment_id])
            verify_data_table_permission(table_id, session=session)
            return mysql_cache.get_key(
                f"table_samples_{table_id}_{current_user.id}",
                expires_after=seconds_in_a_day,
                session=session,
            )
    except LookupError:
        return None


@register("/table/<int:table_id>/column/<column_name>/", methods=["GET"])
def get_column_by_table(table_id, column_name, with_table=False):
    with DBSession() as session:
        column = logic.get_column_by_name(column_name, table_id, session=session)
        verify_data_table_permission(column.table_id, session=session)
        column_dict = column.to_dict(with_table)

        return column_dict


@register("/column/<int:column_id>/", methods=["GET"])
@limiter.limit("120 per minute")
def get_column(column_id, with_table=False):
    column = logic.get_column_by_id(column_id)
    verify_data_table_permission(column.table_id)
    return logic.get_detailed_column_dict(column, with_table=with_table)


@register("/column/<int:column_id>/", methods=["PUT"])
def update_column_by_id(
    column_id,
    description=None,
):
    with DBSession() as session:
        verify_data_column_permission(column_id, session=session)
        return logic.update_column_by_id(
            column_id,
            description=description,
            session=session,
        )


@register("/table/<int:table_id>/query_examples/", methods=["GET"])
def get_table_query_examples(
    table_id,
    environment_id,
    uid=None,
    engine_id=None,
    with_table_id=None,
    limit=10,
    offset=0,
):
    api_assert(limit < 100)

    with DBSession() as session:
        verify_environment_permission([environment_id])
        verify_data_table_permission(table_id, session=session)
        engines = admin_logic.get_query_engines_by_environment(
            environment_id, session=session
        )
        engine_ids = [engine.id for engine in engines]
        api_assert(engine_id is None or engine_id in engine_ids, "Invalid engine id")
        query_logs = logic.get_table_query_examples(
            table_id,
            engine_ids,
            uid=uid,
            engine_id=engine_id,
            with_table_id=with_table_id,
            limit=limit,
            offset=offset,
            session=session,
        )
        query_ids = [log.query_execution_id for log in query_logs]

        return query_ids


@register("/table/<int:table_id>/query_examples/users/", methods=["GET"])
def get_table_query_examples_users(table_id, environment_id, limit=5):
    api_assert(limit <= 10)
    verify_environment_permission([environment_id])
    verify_data_table_permission(table_id)
    engines = admin_logic.get_query_engines_by_environment(environment_id)
    engine_ids = [engine.id for engine in engines]
    users = logic.get_query_example_users(table_id, engine_ids, limit=limit)

    return [{"uid": r[0], "count": r[1]} for r in users]


@register("/table/<int:table_id>/query_examples/engines/", methods=["GET"])
def get_table_query_examples_engines(table_id, environment_id):
    verify_environment_permission([environment_id])
    verify_data_table_permission(table_id)
    engines = logic.get_query_example_engines(table_id, environment_id=environment_id)

    return [{"engine_id": r[0], "count": r[1]} for r in engines]


@register("/table/<int:table_id>/query_examples/concurrences/", methods=["GET"])
def get_table_query_examples_concurrences(table_id, limit=5):
    api_assert(limit <= 10)
    verify_data_table_permission(table_id)
    concurrences = logic.get_query_example_concurrences(table_id, limit=limit)
    return [{"table_id": r[0], "count": r[1]} for r in concurrences]


@register("/table/boost_score/<metastore_name>/", methods=["POST", "PUT"])
def upsert_table_boost_score_by_name(metastore_name, data):
    # TODO: verify user is a service account
    with DBSession() as session:
        metastore = admin_logic.get_query_metastore_by_name(
            metastore_name, session=session
        )
        api_assert(metastore, "Invalid metastore")
        verify_metastore_permission(metastore.id, session=session)

        with DataTableFinder(metastore.id) as t_finder:
            for d in data:
                table = t_finder.get_table_by_name(
                    schema_name=d["schema_name"],
                    table_name=d["table_name"],
                    session=session,
                )

                if table is not None:
                    logic.update_table(
                        id=table.id, score=d["boost_score"], session=session
                    )
        return


@register("/table/boost_score/", methods=["POST", "PUT"])
def update_table_boost_score(data):
    """Batch update table boost scores"""
    # TODO: verify user is a service account
    with DBSession() as session:
        for d in data:
            verify_data_table_permission(d["table_id"], session=session)
            logic.update_table(
                id=d["table_id"], score=d["boost_score"], session=session
            )

        return


@register("/table/stats/<int:table_id>/", methods=["GET"])
def get_table_stats(table_id):
    """Get all table stats by id"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return DataTableStatistics.get_all(table_id=table_id, session=session)


@register("/table/stats/<metastore_name>/", methods=["POST"])
def create_table_stats_by_name(metastore_name, data):
    """Batch add/update table stats"""
    # TODO: verify user is a service account
    with DBSession() as session:
        metastore = admin_logic.get_query_metastore_by_name(
            metastore_name, session=session
        )
        api_assert(metastore, "Invalid metastore")
        verify_metastore_permission(metastore.id, session=session)

        with DataTableFinder(metastore.id) as t_finder:
            for d in data:
                table = t_finder.get_table_by_name(
                    schema_name=d["schema_name"],
                    table_name=d["table_name"],
                    session=session,
                )

                if table is not None:
                    for s in d["stats"]:
                        logic.upsert_table_stat(
                            table_id=table.id,
                            key=s["key"],
                            value=s["value"],
                            uid=current_user.id,
                            session=session,
                        )
    return


@register("/table/stats/", methods=["POST"])
def create_table_stats(data):
    """Batch add/update table stats"""
    # TODO: verify user is a service account
    with DBSession() as session:
        for d in data:
            verify_data_table_permission(d["table_id"], session=session)
            for s in d["stats"]:
                logic.upsert_table_stat(
                    table_id=d["table_id"],
                    key=s["key"],
                    value=s["value"],
                    uid=current_user.id,
                    session=session,
                )
    return


@register("/lineage/", methods=["POST"])
@admin_only
def add_lineage(table_id, parent_table_id, job_metadata_id):
    """
    Adds a table lineage to DB
    Example data structure:
    {
        "table_id": 1,
        "parent_table_id": 2,
        "job_metadata_id": 3
    }
    Returns new table lineage dictionary
    """
    with DBSession() as session:
        table_lineage = lineage.add_table_lineage(
            table_id, parent_table_id, job_metadata_id, True, session=session
        )
        return table_lineage.to_dict()


@register("/lineage/<int:table_id>/parent/", methods=["GET"])
def get_table_parent_lineages(table_id):
    with DBSession() as session:
        return lineage.get_table_parent_lineages(table_id, session=session)


@register("/lineage/<int:table_id>/child/", methods=["GET"])
def get_table_child_lineages(table_id):
    with DBSession() as session:
        return lineage.get_table_child_lineages(table_id, session=session)


@register("/table_warning/", methods=["POST"])
def create_table_warning(table_id, message, severity):
    verify_data_table_permission(table_id)
    return DataTableWarning.create(
        {
            "message": message,
            "severity": DataTableWarningSeverity(severity),
            "created_by": current_user.id,
            "updated_by": current_user.id,
            "table_id": table_id,
        }
    )


@register("/table_warning/<int:warning_id>/", methods=["PUT"])
def update_table_warning(warning_id, **fields):
    warning = DataTableWarning.get(id=warning_id)
    verify_data_table_permission(warning.table_id)

    if "severity" in fields:
        fields["severity"] = DataTableWarningSeverity(fields["severity"])

    return DataTableWarning.update(
        id=warning_id,
        fields={**fields, "updated_by": current_user.id},
        field_names=["message", "severity", "updated_by"],
    )


@register("/table_warning/<int:warning_id>/", methods=["DELETE"])
def delete_table_warning(warning_id):
    warning = DataTableWarning.get(id=warning_id)
    verify_data_table_permission(warning.table_id)
    DataTableWarning.delete(warning_id)


@register("/schemas/", methods=["GET"])
def get_schemas(
    metastore_id, limit=5, offset=0, sort_key="name", sort_order="desc", name=None
):
    verify_metastore_permission(metastore_id)
    schemas = logic.get_all_schemas(
        metastore_id, offset, limit, sort_key, sort_order, name
    )

    return {"results": schemas, "done": len(schemas) < limit}


@register(
    "/table/<schema_name>/<table_name>/sync/",
    methods=["PUT"],
)
@limiter.limit("500 per minute")
def sync_table_by_table_name(schema_name, table_name, metastore_id):
    """Sync table info with metastore.

    Args:
        metastore_id (int): Metastore ID
        schema_name (str): Schema name
        table_name (str): Table name

    Returns:
        None if the table doesn't exist neither metastore nor querybook
        -1 if table is deleted
        table id if creating or updating a table
    """
    metastore_loader = get_metastore_loader(metastore_id)
    return metastore_loader.sync_table(schema_name, table_name)
