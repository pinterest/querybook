from typing import List
from lib.utils.import_helper import import_modules, import_module_with_default
from lib.query_analysis.transpilation.base_query_transpiler import BaseQueryTranspiler

ALL_PLUGIN_QUERY_QUERY_TRANSPILERS = import_module_with_default(
    "query_transpilation_plugin", "ALL_PLUGIN_QUERY_TRANSPILERS", default=[]
)

PROVIDED_TRANSPILERS = import_modules(
    [
        (
            "lib.query_analysis.transpilation.transpilers.sqlglot_transpiler",
            "SQLGlotTranspiler",
        ),
    ]
)

ALL_TRANSPILERS: List[BaseQueryTranspiler] = ALL_PLUGIN_QUERY_QUERY_TRANSPILERS + [
    transpiler_cls() for transpiler_cls in PROVIDED_TRANSPILERS
]


def get_transpiler_by_name(name: str) -> BaseQueryTranspiler:
    for transpiler in ALL_TRANSPILERS:
        if transpiler.name() == name:
            return transpiler

    raise ValueError(f"Transpiler {name} is not found")
