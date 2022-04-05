from abc import ABCMeta, abstractmethod
from collections import deque
from itertools import islice
from typing import Generator, List


from env import QuerybookSettings
from lib.utils.csv import string_to_csv, LINE_TERMINATOR, split_csv_to_chunks


class FileDoesNotExist(Exception):
    pass


class ChunkReader(metaclass=ABCMeta):
    def __init__(
        self,
        read_size=QuerybookSettings.STORE_READ_SIZE,
        max_read_size=QuerybookSettings.STORE_MAX_READ_SIZE,
    ):
        # The chunk read size
        self._read_size = read_size
        # Max number of chars we will read
        self._max_read_size = max_read_size

        self._num_char_read = 0
        self._eof = False
        self._buffer_deque = deque([])
        self._raw_buffer = ""

    def get_csv_iter(self, number_of_lines=None):
        csv_line_count = 0
        partial_csv_lines = []
        for csv_chunk in self._read_csv_chunk():
            valid_csv_chunk, partial_csv_lines = split_csv_to_chunks(
                partial_csv_lines + csv_chunk
            )
            if len(valid_csv_chunk) == 0:
                continue

            csv_chunk_str = LINE_TERMINATOR.join(valid_csv_chunk)
            csv = string_to_csv(csv_chunk_str)

            if number_of_lines is None:
                yield from csv
            else:
                rows_to_yield = min(len(csv), number_of_lines - csv_line_count)
                csv_line_count += rows_to_yield
                yield from islice(csv, rows_to_yield)

                if csv_line_count >= number_of_lines:
                    break

    def _read_csv_chunk(self) -> Generator[List[str], None, None]:
        """
        Similar to read_line, get the entire chunk of buffer_deque and process
        them together as CSV
        """
        while (not self._eof) or len(self._buffer_deque):
            if len(self._buffer_deque) > 0:
                line_chunks = []
                while len(self._buffer_deque) > 0:
                    line_chunks.append(self._buffer_deque.popleft())
                yield line_chunks

            # If not at the end, perform another round of loading
            if not self._eof:
                self._fill_buffer()

    def read_lines(self, number_of_lines=None) -> List[str]:
        return [line for line in islice(self.read_line(), number_of_lines)]

    def read_line(self):  # generator
        while (not self._eof) or len(self._buffer_deque):
            if len(self._buffer_deque) > 0:
                yield self._buffer_deque.popleft()
            elif not self._eof:
                self._fill_buffer()

    def _fill_buffer(self):
        raw = self.read()
        if len(raw):
            rawLines = raw.split(LINE_TERMINATOR)
            rawLines[0] = self._raw_buffer + rawLines[0]
            for line in rawLines[:-1]:
                # Update how many chars are read
                line_len = len(line)
                self._num_char_read += line_len

                # If we read enough, break
                if (
                    self._max_read_size is not None
                    and self._num_char_read > self._max_read_size
                ):
                    self._trigger_eof(real_eof=False)
                    return

                self._buffer_deque.append(line)
            self._raw_buffer = rawLines[-1]
        else:
            self._trigger_eof()

    def _trigger_eof(self, real_eof=True):
        # We can have real_eof which means we actually reached the end of file
        # or fake eof when we read enough data
        self._eof = True
        if real_eof and len(self._raw_buffer):
            self._num_char_read += len(self._raw_buffer)
            if (
                self._max_read_size is None
                or self._num_char_read <= self._max_read_size
            ):
                self._buffer_deque.append(self._raw_buffer)

    @abstractmethod
    def read(self) -> str:
        """
           Get string from the last read,
           It is expected that the size returned it equal to self._read_size but
           not required.

           Return empty string when reaching eof

        Raises:
            NotImplementedError: Must be implemented by the child class

        Returns:
            str -- The raw string from file
        """
        raise NotImplementedError()
