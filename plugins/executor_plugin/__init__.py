# from lib.query_executor.base_executor import QueryExecutorBaseClass


ALL_PLUGIN_EXECUTORS = [

]

# Optional hook invoked inside a Flask request to compute extra kwargs that
# should be merged into the executor ``client_setting`` dict (i.e. the dict
# eventually splatted into the executor client constructor, e.g.
# ``TrinoClient(**client_setting)``).
#
# Signature: () -> Dict[str, Any]
#
# The hook fires in two situations:
#   - Async path: ``initiate_query_execution`` invokes it while still in the
#     Flask request that created the QueryExecution, and the returned dict is
#     passed to ``run_query_task.apply_async`` as the ``client_setting_override``
#     kwarg. The Celery worker merges it into ``client_setting`` without ever
#     invoking the hook itself.
#   - Direct/sync path: callers of ``get_client_setting_from_engine`` that
#     don't pass an explicit ``client_setting_override`` trigger an inline
#     invocation. Hook implementations should return ``{}`` when there is no
#     live Flask request or when no request-scoped settings apply.
#
# Convention: return ``{}`` for the common in-app case so downstream consumers
# can treat the absence of an injected key as "use defaults".
EXTRA_CLIENT_SETTINGS_HOOK = None
