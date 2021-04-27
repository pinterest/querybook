from enum import Enum


# KEEP IT CONSISTENT AS config/datadoc.yaml
class DataCellType(Enum):
    query = 0
    text = 1
    chart = 2


DATA_DOC_NAMESPACE = "/datadoc"
