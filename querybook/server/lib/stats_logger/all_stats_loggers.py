from lib.utils.import_helper import import_module_with_default
from .loggers.null_stats_logger import NullStatsLogger
from .loggers.console_stats_logger import ConsoleStatsLogger

ALL_PLUGIN_STATS_LOGGERS = import_module_with_default(
    "stats_logger_plugin",
    "ALL_PLUGIN_STATS_LOGGERS",
    default=[],
)

ALL_STATS_LOGGERS = [NullStatsLogger(), ConsoleStatsLogger()] + ALL_PLUGIN_STATS_LOGGERS


def get_stats_logger_class(name: str):
    for logger in ALL_STATS_LOGGERS:
        if logger.logger_name == name:
            return logger
    raise ValueError(f"Unknown event logger name {name}")
