from typing import Any, Dict, Optional

from lib.table_upload.importer.csv_file_importer import CSVFileImporter
from lib.table_upload.importer.query_execution_importer import (
    QueryExecutionImporter,
)


def get_table_upload_importer(import_config: Dict, file_to_upload: Optional[Any]):
    source_type = import_config["source_type"]

    if source_type == "file":
        return CSVFileImporter(file_to_upload, import_config["parse_config"])
    elif source_type == "query_execution":
        return QueryExecutionImporter(import_config["query_execution_id"])
    else:
        raise ValueError(f"Invalid source type {source_type}")
