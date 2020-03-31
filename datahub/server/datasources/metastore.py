from flask_login import current_user
from datetime import datetime

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

from lib.utils import mysql_cache
from lib.utils.utils import DATETIME_TO_UTC
from lib.utils.execute_query import execute_query
from lib.query_analysis.samples import make_samples_query

from logic import metastore as logic
from logic import admin as admin_logic


# TODO: remove this
max_return_size = 5000000
seconds_in_a_day = 60 * 60 * 24


@register("/query_metastore/", methods=["GET"])
# @cache.memoize(14400)
def get_all_query_metastores(environment_id,):
    verify_environment_permission([environment_id])
    metastores = admin_logic.get_all_query_metastore_by_environment(environment_id)
    metastores_dict = [metastore.to_dict() for metastore in metastores]

    return metastores_dict


# # TODO: Remove or modify
# @register('/schema/', methods=['GET'])
# @cache.memoize(14400)  # Temporal for faster development
# def get_all_schema(offset=0, limit=100, with_datasource=False, with_table=False):
#     with DBSession() as session:
#         schemas = logic.get_all_schema(offset, limit, session=session)
#         result = [schema.to_dict(with_datasource, with_table) for schema in schemas]

#     return result


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
        result = logic.get_table_by_schema_id(schema_id, session=session)

    return [table.to_dict() for table in result]


@register("/table/<int:table_id>/", methods=["GET"])
@with_impression("table_id", ImpressionItemType.DATA_TABLE)
def get_table(table_id, with_schema=True, with_column=True):
    # username = flask_session['uid']
    with DBSession() as session:
        table = logic.get_table_by_id(table_id, session=session)
        api_assert(table, "Invalid table")
        verify_data_schema_permission(table.schema_id, session=session)
        result = table.to_dict(with_schema, with_column)
        return result


@register("/table_name/<schema_name>/<table_name>/", methods=["GET"])
def get_table_by_name(
    schema_name, table_name, metastore_id, with_schema=True, with_column=True
):
    # username = flask_session['uid']
    with DBSession() as session:
        table = logic.get_table_by_name(
            schema_name, table_name, metastore_id, session=session
        )
        api_assert(table, "{}.{} does not exist".format(schema_name, table_name))
        verify_data_schema_permission(table.schema_id, session=session)
        table_dict = table.to_dict(with_schema, with_column)

        # update_impressions(table_dict['id'], 'DataTable', username, table_dict['name'], item_key=None)

    return table_dict


@register("/data_job_metadata/<int:data_job_metadata_id>/", methods=["GET"])
def get_data_job_metadata(data_job_metadata_id):
    with DBSession() as session:
        # TODO: add some kind of permission check here
        result = logic.get_data_job_metadata_by_id(
            data_job_metadata_id, session=session
        )
        result = result.to_dict()

    return result


@register("/data_job_metadata/", methods=["POST"], require_auth=True)
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


@register("/table/<int:table_id>/", methods=["PUT"], require_auth=True)
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

        table = logic.get_table_by_id(table_id, session=session)
        table_dict = table.to_dict()
    return table_dict


@register("/table/<int:table_id>/column/", methods=["GET"])
def get_columns_from_table(table_id):
    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        result = logic.get_column_by_table_id(table_id, session=session)
        return [column.to_dict() for column in result]


@register("/table/<int:table_id>/samples/", methods=["POST"], require_auth=True)
def create_table_samples(table_id, environment_id, engine_id, limit=50):
    with DBSession() as session:
        api_assert(limit <= 100, "Too many rows requested")
        verify_environment_permission([environment_id])
        verify_data_table_permission(table_id, session=session)
        query_engine = admin_logic.get_query_engine_by_id(engine_id, session=session)
        api_assert(
            query_engine.environment_id == environment_id,
            "Query engine does not belong to environment",
        )

        query = make_samples_query(table_id, limit, session=session)
        results = {
            "created_at": DATETIME_TO_UTC(datetime.now()),
            "value": execute_query(query, engine_id, session=session),
            "engine_id": engine_id,
            "created_by": current_user.id,
        }

        mysql_cache.set_key(
            f"table_samples_{table_id}_{environment_id}",
            results,
            expires_after=seconds_in_a_day,
            session=session,
        )
        return results


@register("/table/<int:table_id>/samples/", methods=["GET"], require_auth=True)
def get_table_samples(table_id, environment_id, limit=100):
    try:
        with DBSession() as session:
            verify_environment_permission([environment_id])
            verify_data_table_permission(table_id, session=session)
            return mysql_cache.get_key(
                f"table_samples_{table_id}_{environment_id}",
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
        result = logic.update_column_by_id(
            column_id, description=description, session=session,
        )
        result = result.to_dict() if result else None

    return result


@register("/table/<int:table_id>/query_examples/", methods=["GET"])
def get_table_query_examples(table_id, limit=10, offset=0):
    api_assert(limit < 100)

    with DBSession() as session:
        verify_data_table_permission(table_id, session=session)
        query_logs = logic.get_table_query_examples(
            table_id, limit=limit, offset=offset, session=session
        )
        query_ids = [log.query_execution_id for log in query_logs]

        return query_ids


@register("/lineage/", methods=["GET"], require_auth=True)
def get_lineage():
    with DBSession() as session:
        # TODO: improve this end point and add permission
        lineages = logic.get_all_table_lineages(session=session)
        return [lineage.to_dict() for lineage in lineages]


@register("/lineage/", methods=["POST"], require_auth=True)
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


@register("/lineage/<int:table_id>/parent/", methods=["GET"], require_auth=True)
def get_table_parent_lineages(table_id):
    with DBSession() as session:
        lineages = logic.get_table_parent_lineages(table_id, session=session)
        return [lineage.to_dict() for lineage in lineages]


@register("/lineage/<int:table_id>/child/", methods=["GET"], require_auth=True)
def get_table_child_lineages(table_id):
    with DBSession() as session:
        lineages = logic.get_table_child_lineages(table_id, session=session)
        return [lineage.to_dict() for lineage in lineages]
