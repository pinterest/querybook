from lib.utils.import_helper import import_module_with_default
from .loggers.console_event_logger import ConsoleEventLogger
from .loggers.null_event_logger import NullEventLogger
from .loggers.db_event_logger import DBEventLogger

ALL_PLUGIN_EVENT_LOGGERS = import_module_with_default(
    "event_logger_plugin",
    "ALL_PLUGIN_EVENT_LOGGERS",
    default=[],
)

ALL_EVENT_LOGGERS = [
    ConsoleEventLogger(),
    NullEventLogger(),
    DBEventLogger(),
] + ALL_PLUGIN_EVENT_LOGGERS


def get_event_logger_class(name: str):
    for logger in ALL_EVENT_LOGGERS:
        if logger.logger_name == name:
            return logger
    raise ValueError(f"Unknown event logger name {name}")
