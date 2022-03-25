from itertools import islice
from typing import Generator, List, Optional

from env import QuerybookSettings
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from logic import result_store
from lib.utils.csv import str_to_csv_iter, LINE_TERMINATOR


class DBReader(BaseReader):
    def __init__(self, uri: str, **kwargs):
        self._uri = uri
        self._text = ""

    def start(self):
        kvs = result_store.get_key_value_store(self._uri)
        if kvs:
            self._text = kvs.value

    def _get_first_n_lines(self, n: Optional[int]) -> List[str]:
        maxsplit = n if n is not None else -1
        lines = self._text.split(LINE_TERMINATOR, maxsplit)
        if n is not None and len(lines) == n + 1:
            self._text = lines[-1]
            return lines[:-1]
        else:
            self._text = ""
            return lines

    def get_csv_iter(
        self, number_of_lines: Optional[int] = None
    ) -> Generator[List[List[str]], None, None]:
        return islice(str_to_csv_iter(self.read_raw()), number_of_lines)

    def read_lines(self, number_of_lines: int) -> List[str]:
        return self._get_first_n_lines(number_of_lines)

    def read_raw(self) -> str:
        return self._text

    def end(self):
        self._text = ""

    @property
    def has_download_url(self):
        return False

    def get_download_url(self, custom_name=None):
        return None


class DBUploader(BaseUploader):
    def __init__(self, uri: str):
        self._reset_variables()
        self._uri = uri

    def _reset_variables(self):
        self._chunks = []
        self._chunks_length = 0
        self.is_uploading = False

    def start(self):
        self._reset_variables()
        self.is_uploading = True

    def write(self, data: str) -> bool:
        data_len = len(data)
        if (
            QuerybookSettings.DB_MAX_UPLOAD_SIZE > 0
            and self._chunks_length + data_len > QuerybookSettings.DB_MAX_UPLOAD_SIZE
        ):
            return False

        self._chunks_length += data_len
        self._chunks.append(data)
        return True

    def end(self):
        result_store.create_key_value_store(key=self._uri, value="".join(self._chunks))
        self._reset_variables()
