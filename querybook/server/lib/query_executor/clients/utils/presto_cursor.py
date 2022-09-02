from abc import ABC, abstractmethod
from typing import Any, Dict, Generic, List, Optional, Tuple, TypeVar, Union

from .presto_types import PrestoType, rename_duplicate_names

CursorT = TypeVar("CursorT")
CursorReturnT = TypeVar("CursorReturnT", bound=Union[List[Any], Tuple])


class PrestoCursorMixin(Generic[CursorT, CursorReturnT], ABC):
    _cursor: CursorT
    _percent_complete: float
    _tracking_url: Optional[str]

    @abstractmethod
    def _init_query_state_vars(self) -> None:
        pass

    @abstractmethod
    def _update_percent_complete(self, poll_result: Dict[str, Any]) -> None:
        pass

    @abstractmethod
    def _update_tracking_url(self, poll_result: Dict[str, Any]) -> None:
        pass

    @property
    def percent_complete(self):
        return self._percent_complete

    @property
    def presto_types(self) -> List[PrestoType]:
        return [PrestoType.from_string(i[1]) for i in self._cursor.description]

    @property
    def tracking_url(self):
        return self._tracking_url

    @staticmethod
    def transform_row(row: CursorReturnT, presto_types: List[PrestoType]) -> List[Any]:
        return [pt.format_data(data) for data, pt in zip(row, presto_types)]

    def cancel(self):
        self._cursor.cancel()

    def get_columns(self):
        description = self._cursor.description
        if description is None:
            # Not a select query, no return
            return None
        else:
            return rename_duplicate_names([d[0] for d in description])

    def get_one_row(self) -> List[Any]:
        return self.transform_row(self._cursor.fetchone(), self.presto_types)

    def get_n_rows(self, n: int) -> List[List[Any]]:
        presto_types = self.presto_types
        rows = self._cursor.fetchmany(size=n)
        return [self.transform_row(row, presto_types) for row in rows]

    def run(self, query: str):
        self._init_query_state_vars()
        self._cursor.execute(query)
