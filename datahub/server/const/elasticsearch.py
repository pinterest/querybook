from enum import Enum

# Keep this in sync with elasticsearch.yaml


class ElasticsearchItem(Enum):
    datadocs = "datadocs"
    tables = "tables"
    users = "users"
    data_cell_data_tables = "data_cell_data_tables"
