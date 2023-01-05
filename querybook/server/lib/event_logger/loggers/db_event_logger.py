from const.event_log import EventType
from lib.event_logger.base_event_logger import BaseEventLogger
from models.event_log import EventLog


class DBEventLogger(BaseEventLogger):
    """Save event logs to querybook mysql db."""

    @property
    def logger_name(self) -> str:
        return "db"

    @property
    def _api_deny_list(self) -> list:
        """API endpoints from this list will not be logged. This list will only be used
        when the allow list is None.

        You can override this property to provide your own list in your logger.
        """
        return [
            {"type": "prefix", "route": "/admin", "method": "*"},
            {"type": "prefix", "route": "/user", "method": "GET"},
            {"type": "exact", "route": "/login/", "method": "POST"},
            {"type": "exact", "route": "/signup/", "method": "POST"},
            {"type": "exact", "route": "/user/setting/<key>/", "method": "POST"},
            {
                "type": "exact",
                "route": "/table/<schema_name>/<table_name>/sync/",
                "method": "PUT",
            },
            {"type": "exact", "route": "/announcement/", "method": "GET"},
            {"type": "exact", "route": "/query/validate/", "method": "POST"},
            {
                "type": "exact",
                "route": "/query_engine/<int:engine_id>/status/",
                "method": "GET",
            },
            {
                "type": "exact",
                "route": "/impression/<item_type>/<item_id>/count/",
                "method": "GET",
            },
            {
                "type": "exact",
                "route": "/utils/change_logs/",
                "method": "GET",
            },
            {
                "type": "exact",
                "route": "/query_engine/",
                "method": "GET",
            },
            {
                "type": "exact",
                "route": "/query_metastore/",
                "method": "GET",
            },
            {
                "type": "exact",
                "route": "/dag_exporter/",
                "method": "GET",
            },
        ]

    def log(
        self, uid: int, event_type: EventType, event_data: dict, timestamp: int = None
    ):
        EventLog.create(
            {"uid": uid, "event_type": event_type, "event_data": event_data}
        )
