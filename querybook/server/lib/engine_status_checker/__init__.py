from lib.utils.import_helper import import_module_with_default
from .base_checker import BaseEngineStatusChecker
from .connection_checker import ConnectionChecker
from .select_one_checker import SelectOneChecker
from .null_checker import NullChecker

ALL_PLUGIN_ENGINE_STATUS_CHECKERS = import_module_with_default(
    "engine_status_checker_plugin", "ALL_PLUGIN_ENGINE_STATUS_CHECKERS", default=[]
)

ALL_ENGINE_STATUS_CHECKERS = [
    ConnectionChecker,
    SelectOneChecker,
    NullChecker,
] + ALL_PLUGIN_ENGINE_STATUS_CHECKERS


def get_engine_checker_class(name: str) -> BaseEngineStatusChecker:
    for checker in ALL_ENGINE_STATUS_CHECKERS:
        if checker.NAME() == name:
            return checker
    raise ValueError(f"Unknown checker name {name}")
