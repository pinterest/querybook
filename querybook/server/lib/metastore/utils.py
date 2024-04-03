from typing import Dict, List
from logic import metastore as logic
from app.db import with_session


class MetastoreTableACLChecker(object):
    def __init__(self, acl_config: Dict):
        self._type = acl_config.get("type")
        self._tables_by_schema = self.process_tables(acl_config.get("tables", []))

    def process_tables(self, tables: List[str]):
        tables_by_schema = {}
        for table in tables:
            full_name = table.split(".")
            if len(full_name) == 1:
                full_name.insert(0, "default")

            schema_name, table_name = full_name
            tables_by_schema.setdefault(schema_name, []).append(table_name)

        return tables_by_schema

    def _is_table_in_list(
        self,
        schema,
        table,
    ):
        if schema in self._tables_by_schema:
            for schema_table in self._tables_by_schema[schema]:
                if schema_table == table or schema_table == "*":
                    return True
                elif schema_table.endswith("*") and table.startswith(schema_table[:-1]):
                    return True
        return False

    def is_table_valid(
        self,
        schema,
        table,
    ):
        if self._type != "allowlist" and self._type != "denylist":
            return True

        table_in_list = self._is_table_in_list(schema, table)
        return table_in_list if self._type == "allowlist" else not table_in_list

    def is_schema_valid(self, schema):
        if self._type != "allowlist" and self._type != "denylist":
            return True
        schema_in_list = schema in self._tables_by_schema
        return schema_in_list if self._type == "allowlist" else not schema_in_list


class DataTableFinder:
    def __init__(self, metastore_id):
        self.metastore_id = metastore_id
        pass

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end()

    def start(self):
        self.schemas = {}

    def end(self):
        pass

    @with_session
    def get_schema_by_name(self, schema_name, session):
        if schema_name not in self.schemas:
            self.schemas[schema_name] = logic.get_schema_by_name_and_metastore_id(
                schema_name=schema_name,
                metastore_id=self.metastore_id,
                session=session,
            )
        return self.schemas.get(schema_name)

    @with_session
    def get_table_by_name(self, schema_name, table_name, session):
        schema = self.get_schema_by_name(schema_name=schema_name, session=session)

        if schema:
            return logic.get_table_by_schema_id_and_name(
                schema_id=schema.id, name=table_name, session=session
            )

    @with_session
    def get_table_column_by_name(self, schema_name, table_name, column_name, session):
        table = self.get_table_by_name(
            schema_name=schema_name, table_name=table_name, session=session
        )

        if table:
            return logic.get_column_by_name(
                name=column_name, table_id=table.id, session=session
            )
