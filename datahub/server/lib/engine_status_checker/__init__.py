from lib.utils.plugin import import_plugin
from .connection_checker import ConnectionChecker
from .select_one_checker import SelectOneChecker
from .null_checker import NullChecker

ALL_PLUGIN_ENGINE_STATUS_CHECKERS = import_plugin(
    "engine_status_checker_plugin", "ALL_PLUGIN_ENGINE_STATUS_CHECKERS", []
)

ALL_ENGINE_STATUS_CHECKERS = [
    ConnectionChecker,
    SelectOneChecker,
    NullChecker,
] + ALL_PLUGIN_ENGINE_STATUS_CHECKERS


def get_engine_checker_class(name: str):
    for checker in ALL_ENGINE_STATUS_CHECKERS:
        if checker.NAME() == name:
            return checker
    raise ValueError(f"Unknown checker name {name}")
