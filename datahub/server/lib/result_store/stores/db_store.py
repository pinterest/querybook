from typing import List

from env import DataHubSettings
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from logic.result_store import (
    get_key_value_store,
    create_key_value_store,
    string_to_csv,
)


class DBReader(BaseReader):
    def __init__(self, uri: str):
        self._uri = uri
        self._text = ""

    def start(self):
        kvs = get_key_value_store(self._uri)
        if kvs:
            self._text = kvs.value

    def _get_first_n_lines(self, n: int) -> List[str]:
        n_plus_one = n + 1
        lines = self._text.split("\n", n_plus_one)
        if len(lines) == n_plus_one:
            self._text = lines[-1]
            return lines[:-1]
        else:
            self._text = ""
            return lines

    def read_csv(self, number_of_lines: int) -> List[List[str]]:
        curr_lines = self._get_first_n_lines(number_of_lines)
        raw_csv_str = "\n".join(curr_lines)
        return string_to_csv(raw_csv_str)

    def read_lines(self, number_of_lines: int) -> List[str]:
        return self._get_first_n_lines(number_of_lines)

    def read_raw(self) -> str:
        return self._text

    def end(self):
        self._text = ""

    @property
    def has_download_url(self):
        return False

    def get_download_url(self):
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
            DataHubSettings.DB_MAX_UPLOAD_SIZE > 0
            and self._chunks_length + data_len > DataHubSettings.DB_MAX_UPLOAD_SIZE
        ):
            return False

        self._chunks_length += data_len
        self._chunks.append(data)
        return True

    def end(self):
        create_key_value_store(key=self._uri, value="".join(self._chunks))
        self._reset_variables()
