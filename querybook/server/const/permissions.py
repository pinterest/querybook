from enum import Enum


class BoardDataDocPermission(Enum):
    READ = "read"
    EXECUTE = "execute"
    WRITE = "write"
