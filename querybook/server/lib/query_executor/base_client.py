from time import sleep
from abc import ABCMeta, abstractmethod
from typing import List, Any


class ClientBaseClass(metaclass=ABCMeta):
    @abstractmethod
    def cursor(self):
        """Return Something that
        inherits CursorBaseClass
        """

        pass


class CursorBaseClass(metaclass=ABCMeta):
    @abstractmethod
    def run(self, query):
        pass

    @abstractmethod
    def poll(self) -> bool:
        """Update the internal states of the cursor.
           And checks if the query is completed

        Returns:
            bool -- True if the query is completed
        """

        pass

    @abstractmethod
    def cancel(self):
        pass

    @abstractmethod
    def get_one_row(self) -> List[Any]:
        pass

    @abstractmethod
    def get_columns(self) -> List[str]:
        pass

    # The follow functions are optional overrides
    def get_n_rows(self, n: int) -> List[List[Any]]:
        """
            Creates a generator which fetches n rows one by one,
            consider override this for more efficiency

        Arguments:
            n {int} -- max number of rows to fetch

        Returns:
            row -- [description]
        """

        for _ in range(n):
            row = self.get_one_row()
            if row is None:
                break
            yield row

    @property
    def tracking_url(self) -> str:
        """Some query engine provides
           an url for other

        Returns:
            [type] -- [description]
        """

        return None

    @property
    def percent_complete(self) -> float:
        """Get a percentage estimate of query completion
            For Presto, it is #completed_split/#total_split

        Returns:
            float -- the percentage completion between [0, 100]
        """

        return 0

    def get_logs(self) -> str:
        """Fetch the logs from the engine. Note that every time this
           function is called, it should return the logs after last
           call

        Returns:
            str -- The logs
        """

        return ""

    # These functions are intended to use as is
    def get_rows_iter(self, chunk_size: int = 10000):
        while True:
            rows = self.get_n_rows(chunk_size)

            if rows is None or len(rows) == 0:
                break
            for row in rows:
                yield row

    def get_rows(self) -> List:
        return [row for row in self.get_rows_iter()]

    def get(self) -> List:
        """Return all columns + rows

        Returns:
            List -- The tabular data, first row is columns, followed by the return results
        """
        columns = self.get_columns()
        if columns is None:
            return None
        else:
            rows = self.get_rows()
            return [columns] + rows

    def poll_until_finish(self, poll_interval=5):
        """Calling this function will continuously poll and sleep until finish

        Keyword Arguments:
            poll_interval {int} -- The sleep interval (default: {5})
        """
        while True:
            # Poll returns true when finished
            if self.poll():
                break
            sleep(poll_interval)
