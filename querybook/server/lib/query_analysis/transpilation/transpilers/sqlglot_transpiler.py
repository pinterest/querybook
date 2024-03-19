import sqlglot

from typing import List

from const.sqlglot import QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING
from lib.query_analysis.transpilation.base_query_transpiler import BaseQueryTranspiler


def statements_to_query(statements: List[str]):
    return "\n".join(statement + ";" for statement in statements)


class SQLGlotTranspiler(BaseQueryTranspiler):
    def name(self) -> str:
        return "SQLGlotTranspiler"

    def from_languages(self) -> List[str]:
        return list(QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING.keys())

    def to_languages(self) -> List[str]:
        return list(QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING.keys())

    def transpile(self, query: str, from_language: str, to_language: str):
        sqlglot_from_language = QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING[from_language]
        sqlglot_to_language = QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING[to_language]

        transpiled_statements = sqlglot.transpile(
            query,
            read=sqlglot_from_language,
            write=sqlglot_to_language,
            pretty=True,
        )

        original_formatted_statements = sqlglot.transpile(
            query,
            read=sqlglot_from_language,
            write=sqlglot_from_language,
            pretty=True,
        )

        return {
            "transpiled_query": statements_to_query(transpiled_statements),
            "original_query": statements_to_query(original_formatted_statements),
        }
