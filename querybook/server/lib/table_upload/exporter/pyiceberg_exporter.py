import pyarrow as pa
from typing import Tuple

from app.db import with_session
from lib.table_upload.exporter.base_exporter import BaseTableUploadExporter
from lib.table_upload.exporter.utils import update_pandas_df_column_name_type
from pyiceberg.catalog import load_catalog


class PyIcebergExporter(BaseTableUploadExporter):
    """Exporter that creates Iceberg tables via PyIceberg"""

    def _get_catalog(self):
        """Load PyIceberg catalog using configuration from exporter config

        Returns:
            PyIceberg catalog instance
        """
        catalog_config = self._exporter_config.get("catalog_config")
        if not catalog_config:
            raise Exception(
                "PyIcebergExporter requires 'catalog_config' in exporter configuration"
            )

        catalog = load_catalog(**catalog_config)
        return catalog

    @property
    def _fq_table_name(self):
        return (self._table_config["schema_name"], self._table_config["table_name"])

    @with_session
    def _upload(self, session=None) -> Tuple[str, str]:
        """Create Iceberg table and insert data using PyIceberg

        Args:
            session: Database session

        Returns:
            Tuple of (schema_name, table_name)
        """

        df = update_pandas_df_column_name_type(
            self._importer.get_pandas_df(), self._table_config["column_name_types"]
        )

        schema_name, table_name = self._fq_table_name
        fq_table_name = f"{schema_name}.{table_name}"

        # Load catalog
        catalog = self._get_catalog()

        # Convert DataFrame to PyArrow to get schema
        arrow_table_temp = pa.Table.from_pandas(df, preserve_index=False)
        arrow_schema = arrow_table_temp.schema

        # Handle if_exists logic
        if_exists = self._table_config["if_exists"]
        table_exists = False
        try:
            catalog.load_table(fq_table_name)
            table_exists = True
        except Exception as e:
            # Only catch "table not found" errors
            error_msg = str(e).lower()
            if not (
                "not found" in error_msg
                or "does not exist" in error_msg
                or "notfound" in error_msg
            ):
                raise

        if table_exists:
            if if_exists == "fail":
                raise Exception(f"Table {fq_table_name} already exists.")
            elif if_exists == "replace":
                catalog.drop_table(fq_table_name)
            elif if_exists == "append":
                raise Exception("Cannot use append for S3 table export")

        # Build table properties
        table_properties = self._exporter_config.get("table_properties", {})
        if isinstance(table_properties, list):
            table_properties = {
                kv.split("=", 1)[0]: kv.split("=", 1)[1]
                for kv in table_properties
                if "=" in kv
            }

        # Create Iceberg table
        table = catalog.create_table(
            identifier=fq_table_name,
            schema=arrow_schema,
            properties=table_properties,
        )

        # Append data to table
        arrow_schema_with_ids = table.schema().as_arrow()
        arrow_table = pa.Table.from_pandas(
            df, schema=arrow_schema_with_ids, preserve_index=False
        )
        table.append(arrow_table)
        return self._fq_table_name
