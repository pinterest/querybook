from flask_login import current_user

from app.auth.permission import (
    verify_environment_permission,
    verify_metastore_permission,
    verify_data_schema_permission,
    verify_data_table_permission,
    verify_data_column_permission,
)
from app.db import DBSession
from app.datasource import register, api_assert, with_impression, admin_only
from app.flask_app import cache
from const.impression import ImpressionItemType
from const.metastore import DataTableWarningSeverity
from const.time import seconds_in_a_day
from lib.utils import mysql_cache
from logic import metastore as logic
from logic import admin as admin_logic
from models.metastore import DataTableWarning
from tasks.run_sample_query import run_sample_query


@register("/query_metastore/", methods=["GET"])
def get_all_query_metastores(environment_id,):
    verify_environment_permission([environment_id])
    return admin_logic.get_all_query_metastore_by_environment(environment_id)


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
        api_assert(table, "Invalid table")
        verify_data_schema_permission(table.schema_id, session=session)
        result = table.to_dict(with_schema, with_column, with_warnings)
        return result


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
            table_lineage_ids = logic.create_table_lineage_from_metadata(
                data_job_metadata.id
            )
        return {
            "data_job_metadata_ids": data_job_metadata.id,
            "table_lineage_ids": table_lineage_ids,
        }


@register("/table/<int:table_id>/", methods=["PUT"])
def update_table(table_id, description=None, golden=None, owner=None):
    """Update a table"""
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        if description:
            logic.update_table_information(
                table_id, description=description, session=session
            )
        if owner:
            api_assert(
                current_user.id == owner,
                "You are only allowed to claim ownership for yourself",
            )
            logic.create_or_update_table_ownership_by_table_id(table_id, owner=owner)
        if golden is not None:
            api_assert(
                current_user.is_admin, "Golden table can only be updated by Admin"
            )
            logic.update_table(table_id, golden=golden, session=session)

        return logic.get_table_by_id(table_id, session=session)


@register("/table/<int:table_id>/column/", methods=["GET"])
def get_columns_from_table(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        return logic.get_column_by_table_id(table_id, session=session)


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
        query_engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        api_assert(
            query_engine.environment_id == environment_id,
            "Query engine does not belong to environment",
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
def poll_table_samples(table_id, task_id):
    task = run_sample_query.AsyncResult(task_id)
    if task is not None:
        if task.ready():
            return [True, 100]
        elif task.info is not None:
            progress = task.info if isinstance(task.info, (float, int)) else 0
            return [False, progress]
        else:
            return [False, 0]
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
def get_column(column_id, with_table=False):
    with DBSession() as session:
        column = logic.get_column_by_id(column_id, session=session)
        verify_data_table_permission(column.table_id, session=session)
        column_dict = column.to_dict(with_table)

        return column_dict


@register("/column/<int:column_id>/", methods=["PUT"])
def update_column_by_id(
    column_id, description=None,
):
    with DBSession() as session:
        verify_data_column_permission(column_id, session=session)
        return logic.update_column_by_id(
            column_id, description=description, session=session,
        )


@register("/table/<int:table_id>/query_examples/", methods=["GET"])
def get_table_query_examples(table_id, environment_id, limit=10, offset=0):
    api_assert(limit < 100)

    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        engines = admin_logic.get_query_engines_by_environment(
            environment_id, session=session
        )
        engine_ids = [engine.id for engine in engines]
        query_logs = logic.get_table_query_examples(
            table_id, engine_ids, limit=limit, offset=offset, session=session
        )
        query_ids = [log.query_execution_id for log in query_logs]

        return query_ids


@register("/lineage/", methods=["GET"])
def get_lineage():
    with DBSession() as session:
        # TODO: improve this end point and add permission
        return logic.get_all_table_lineages(session=session)


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
        table_lineage = logic.add_table_lineage(
            table_id, parent_table_id, job_metadata_id, True, session=session
        )
        return table_lineage.to_dict()


@register("/lineage/<int:table_id>/parent/", methods=["GET"])
def get_table_parent_lineages(table_id):
    with DBSession() as session:
        return logic.get_table_parent_lineages(table_id, session=session)


@register("/lineage/<int:table_id>/child/", methods=["GET"])
def get_table_child_lineages(table_id):
    with DBSession() as session:
        return logic.get_table_child_lineages(table_id, session=session)


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
