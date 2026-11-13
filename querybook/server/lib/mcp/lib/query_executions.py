"""Query execution utility functions for MCP tools."""

import json

from const.query_execution import (
    QueryExecutionErrorType,
    QueryExecutionStatus,
    StatementExecutionStatus,
)


def serialize_query_execution_summary(execution) -> dict:
    """Serialize query execution model for list results (lightweight, no statements)."""
    execution_dict = execution.to_dict(with_statement=False)
    execution_dict["query_execution_resource_uri"] = (
        f"querybook://query-execution/{execution.id}"
    )
    if "status" in execution_dict:
        try:
            status_enum = QueryExecutionStatus(execution_dict["status"])
            execution_dict["status_name"] = status_enum.name
        except (ValueError, KeyError):
            pass
    return execution_dict


def serialize_query_execution(execution) -> dict:
    """Serialize query execution model with human-readable status names and resource URIs.

    This function converts a QueryExecution model to a dictionary with human-readable
    status names and resource URIs, while removing internal implementation details.

    Adds:
    - status_name for QueryExecutionStatus (e.g., "DONE", "ERROR")
    - status_name for each StatementExecutionStatus
    - results_resource_uri for each statement execution (MCP resource)
    - download_url for each statement execution:
      * S3/GCS stores: Pre-signed URL (no authentication needed, 24hr expiration)
      * File/DB stores: Flask endpoint URL (requires api-access-token header)

    Removes:
    - result_path (internal field)
    - log_path (internal field)

    Args:
        execution: QueryExecution model object

    Returns:
        Serialized execution dict with status_name fields, resource URIs,
        and internal fields removed.
    """
    # Convert model to dict with statements
    execution_dict = execution.to_dict(with_statement=True)

    # Add query execution resource URI
    execution_dict["query_execution_resource_uri"] = (
        f"querybook://query-execution/{execution.id}"
    )

    # Add query execution status name
    if "status" in execution_dict:
        try:
            status_enum = QueryExecutionStatus(execution_dict["status"])
            execution_dict["status_name"] = status_enum.name
        except (ValueError, KeyError):
            pass

    # Add statement execution status names and resource URIs
    if "statement_executions" in execution_dict:
        for stmt in execution_dict["statement_executions"]:
            if "status" in stmt:
                try:
                    status_enum = StatementExecutionStatus(stmt["status"])
                    stmt["status_name"] = status_enum.name
                except (ValueError, KeyError):
                    pass

            # Add resource URIs for results
            if "id" in stmt:
                stmt["results_resource_uri"] = (
                    f"querybook://statement-execution/{stmt['id']}/results"
                )
                # Add download URL for efficient large dataset downloads
                # (save result_path before removing it)
                result_path = stmt.get("result_path")
                if result_path:
                    from env import QuerybookSettings
                    from lib.result_store import GenericReader

                    try:
                        # For S3/GCS: Generate pre-signed URL (no auth needed)
                        reader = GenericReader(result_path)
                        if reader.has_download_url:
                            download_file_name = (
                                f"result_{execution.id}_{stmt['id']}.csv"
                            )
                            stmt["results_download_url"] = reader.get_download_url(
                                custom_name=download_file_name
                            )
                        # For file/db stores: Use Flask endpoint (requires api-access-token)
                        elif QuerybookSettings.PUBLIC_URL:
                            stmt["results_download_url"] = (
                                f"{QuerybookSettings.PUBLIC_URL}/ds/statement_execution/{stmt['id']}/result/download/"
                            )
                    except Exception:
                        # If download URL generation fails, try Flask endpoint as fallback
                        if QuerybookSettings.PUBLIC_URL:
                            stmt["results_download_url"] = (
                                f"{QuerybookSettings.PUBLIC_URL}/ds/statement_execution/{stmt['id']}/result/download/"
                            )

            # Remove internal result_path and log_path fields
            stmt.pop("result_path", None)
            stmt.pop("log_path", None)

    # Include error details for failed executions
    if execution.error:
        error = execution.error

        # Add human-readable error type name
        error_type_name = None
        if error.error_type is not None:
            try:
                error_type_name = QueryExecutionErrorType(error.error_type).name
            except (ValueError, KeyError):
                pass

        # Try to parse JSON-encoded error messages (e.g. SYNTAX errors)
        error_message = error.error_message
        if error_message:
            try:
                error_message = json.loads(error_message)
            except (json.JSONDecodeError, TypeError):
                pass

        execution_dict["error"] = {
            "error_type": error.error_type,
            "error_type_name": error_type_name,
            "error_message_extracted": error.error_message_extracted,
            "error_message": error_message,
        }

    return execution_dict
