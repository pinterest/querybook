from datetime import datetime
from typing import Dict, List, Tuple

from clients.glue_client import GlueDataCatalogClient
from const.metastore import DataColumn, DataTable
from lib.form import FormField, StructFormField
from lib.metastore.base_metastore_loader import BaseMetastoreLoader
from lib.metastore.loaders.form_fileds import load_partitions_field


class GlueDataCatalogLoader(BaseMetastoreLoader):
    def __init__(self, metastore_dict: Dict):
        self.catalog_id = metastore_dict.get("metastore_params").get("catalog_id")
        self.region = metastore_dict.get("metastore_params").get("region")
        self.load_partitions = metastore_dict.get("metastore_params").get(
            "load_partitions"
        )
        self.glue_client = self._get_glue_data_catalog_client(
            self.catalog_id, self.region
        )
        super(GlueDataCatalogLoader, self).__init__(metastore_dict)

    @classmethod
    def get_metastore_params_template(cls):
        return StructFormField(
            (
                "catalog_id",
                FormField(
                    required=True,
                    description="Enter the Glue Data Catalog ID",
                    regex=r"^\d{12}$",
                ),
            ),
            ("region", FormField(required=True, description="Enter the AWS Region")),
            ("load_partitions", load_partitions_field),
        )

    def get_all_schema_names(self) -> List[str]:
        return self.glue_client.get_all_database_names()

    def get_all_table_names_in_schema(self, schema_name: str) -> List[str]:
        return self.glue_client.get_all_table_names(schema_name)

    def get_table_and_columns(
        self, schema_name: str, table_name: str
    ) -> Tuple[DataTable, List[DataColumn]]:
        glue_table = self.glue_client.get_table(schema_name, table_name).get("Table")

        if self.load_partitions:
            partitions = self.get_partitions(schema_name, table_name)
        else:
            partitions = []

        table = DataTable(
            name=glue_table.get("Name"),
            type=glue_table.get("TableType"),
            owner=glue_table.get("Owner"),
            table_created_at=int(
                glue_table.get("CreateTime", datetime(1970, 1, 1)).timestamp()
            ),
            table_updated_at=int(
                glue_table.get("UpdateTime", datetime(1970, 1, 1)).timestamp()
            ),
            location=glue_table.get("StorageDescriptor").get("Location"),
            partitions=partitions,
            raw_description=glue_table.get("Description"),
        )

        columns = [
            DataColumn(col.get("Name"), col.get("Type"), col.get("Comment"))
            for col in glue_table.get("StorageDescriptor").get("Columns")
        ]

        columns.extend(
            [
                DataColumn(col.get("Name"), col.get("Type"), col.get("Comment"))
                for col in glue_table.get("PartitionKeys")
            ]
        )

        return table, columns

    def get_partitions(
        self, schema_name: str, table_name: str, conditions: Dict[str, str] = None
    ) -> List[str]:
        return self.glue_client.get_hms_style_partitions(
            schema_name, table_name, conditions
        )

    @staticmethod
    def _get_glue_data_catalog_client(catalog_id, region):
        return GlueDataCatalogClient(catalog_id, region)
