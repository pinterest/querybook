from enum import Enum

# Keep this in sync with elasticsearch.yaml


class ElasticsearchItem(Enum):
    query_executions = "query_executions"
    query_cells = "query_cells"
    datadocs = "datadocs"
    tables = "tables"
    users = "users"
    boards = "boards"
