from typing import Dict, List, Tuple
from const.metastore import DataColumn, DataTable
from lib.metastore.base_metastore_loader import BaseMetastoreLoader
from trino import dbapi
from lib.query_executor.executor_template.templates import trino_executor_template
from trino.auth import BasicAuthentication
from lib.query_executor.connection_string.trino import get_trino_connection_conf

class TrinoMetastoreLoader(BaseMetastoreLoader):
    def __init__(self, metastore_dict: Dict):
        self._conn = self._get_trino_connection(metastore_dict)
        super(TrinoMetastoreLoader, self).__init__(metastore_dict)

    def __del__(self):
        self._conn.close()

    @classmethod
    def get_metastore_params_template(cls):
        return trino_executor_template

    def get_all_schema_names(self) -> List[str]:
        cursor = self._conn.cursor()
        cursor.execute("SHOW SCHEMAS")
        schema_names = [row[0] for row in cursor.fetchall()]
        return schema_names

    def get_all_table_names_in_schema(self, schema_name: str) -> List[str]:
        cursor = self._conn.cursor()
        cursor.execute(f"SHOW TABLES FROM {schema_name}")
        table_names = [row[0] for row in cursor.fetchall()]
        return table_names

    def get_table_and_columns(
        self, schema_name, table_name
    ) -> Tuple[DataTable, List[DataColumn]]:
        cursor = self._conn.cursor()
        cursor.execute(f"DESCRIBE {schema_name}.{table_name}")
        columns = []
        for row in cursor.fetchall():
            column_name = row[0]
            column_type = row[1]
            columns.append(DataColumn(
                name=column_name,
                type=column_type,
                comment=""  
            ))
        
        table = DataTable(
            name=table_name,
            type=None,  
            owner=None, 
        )

        return table, columns

    def _get_trino_connection(self, metastore_dict):
        trino_conf = get_trino_connection_conf(metastore_dict['metastore_params']["connection_string"])

        conn = dbapi.connect(
            host=trino_conf.host,
            port=trino_conf.port,
            user=metastore_dict['metastore_params']["username"],
            catalog=trino_conf.catalog,
            schema=trino_conf.schema,
            http_scheme='https',
            auth=BasicAuthentication(metastore_dict['metastore_params']["username"], metastore_dict['metastore_params']["password"]),
        )
        return conn