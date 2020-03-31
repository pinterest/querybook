from typing import Dict, List


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
        self, schema, table,
    ):
        if schema in self._tables_by_schema:
            for schema_table in self._tables_by_schema[schema]:
                if schema_table == table or schema_table == "*":
                    return True
        return False

    def is_table_valid(
        self, schema, table,
    ):
        if self._type != "whitelist" and self._type != "blacklist":
            return True

        table_in_list = self._is_table_in_list(schema, table)
        return table_in_list if self._type == "whitelist" else not table_in_list

    def is_schema_valid(self, schema):
        if self._type != "whitelist" and self._type != "blacklist":
            return True
        schema_in_list = schema in self._tables_by_schema
        return schema_in_list if self._type == "whitelist" else not schema_in_list
