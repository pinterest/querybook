from enum import Enum


class AdminOperation(Enum):
    CREATE = 0
    UPDATE = 1
    DELETE = 2


class AdminItemType(Enum):
    Announcement = "announcement"
    QueryEngine = "query_engine"
    QueryMetastore = "query_metastore"
    Admin = "admin"
    Environment = "environment"
    Task = "task"
