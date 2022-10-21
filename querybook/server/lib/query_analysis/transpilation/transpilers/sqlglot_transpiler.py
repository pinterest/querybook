import sqlglot

from typing import List

from lib.query_analysis.transpilation.base_query_transpiler import BaseQueryTranspiler

# Mapping from Querybook languages to SQLGlot languages
QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING = {
    # same name
    "presto": "presto",
    "trino": "trino",
    "bigquery": "bigquery",
    "clickhouse": "clickhouse",
    "hive": "hive",
    "mysql": "mysql",
    "oracle": "oracle",
    "sqlite": "sqlite",
    "snowflake": "snowflake",
    # different name
    "postgresql": "postgres",
    "sparksql": "spark",
}


class SQLGlotTranspiler(BaseQueryTranspiler):
    def name(self) -> str:
        return "SQLGlotTranspiler"

    def from_languages(self) -> List[str]:
        return list(QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING.keys())

    def to_languages(self) -> List[str]:
        return list(QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING.keys())

    def transpile(self, query: str, from_language: str, to_language: str):
        transpiled_statements = sqlglot.transpile(
            query,
            read=QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING[from_language],
            write=QUERYBOOK_TO_SQLGLOT_LANGUAGE_MAPPING[to_language],
            pretty=True,
        )
        return "\n".join(statement + ";" for statement in transpiled_statements)
