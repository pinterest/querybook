import csv
from itertools import islice
import os
from typing import Optional
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import QuerybookSettings
from lib.utils.csv import str_to_csv_iter

# to use, enable docker volume inside docker-compose.yml
# uncomment lines `- file:/opt/store/`
# and the 'file' volume code @ bottom
# host path (currently '/mnt/querybook-store/') can be changed as desired
# RESULT_STORE_TYPE must be set to 'file'

FILE_STORE_PATH = "/opt/store/"


def get_file_uri(raw_uri: str) -> str:
    if raw_uri.startswith("/"):
        raw_uri = raw_uri[1:]
    if len(raw_uri) == 0:
        raise ValueError("Invalid empty uri provided")
    return f"{FILE_STORE_PATH}{raw_uri}"


class FileUploader(BaseUploader):
    def __init__(self, uri: str):
        self.uri = get_file_uri(uri)

    def start(self):
        self._chunk_size = QuerybookSettings.FILE_CHUNK_SIZE
        self._chunks_length = 0
        self._chunks = []
        os.makedirs(self.uri_dir_path, exist_ok=True)

    def write(self, data: str):
        # Append each line to a list and then dump at once in batches
        data_len = len(data)
        self._chunks_length += data_len
        self._chunks.append(data)

        if self._chunks_length >= self._chunk_size:
            self.unload()
            self._chunks = []
            self._chunks_length = 0

        return True

    def unload(self):
        data = "".join(self._chunks)
        with open(self.uri, "a") as result_file:
            size = os.path.getsize(self.uri) + self._chunks_length
            if size <= QuerybookSettings.FILE_MAX_UPLOAD_SIZE:
                result_file.write(data)

    def end(self):
        self.unload()

    @property
    def uri_dir_path(self):
        uri = self.uri
        return "/".join(uri.split("/")[:-1])


class FileReader(BaseReader):
    def __init__(self, uri: str, **kwargs):
        self._uri = get_file_uri(uri)

    def start(self):
        pass

    def get_csv_iter(self, number_of_lines: Optional[int]):
        return islice(str_to_csv_iter(self.read_raw()), number_of_lines)

    def read_lines(self, number_of_lines: int):
        with open(self.uri) as result_file:
            lines = []
            line_count = 0
            for row in result_file:
                if line_count < number_of_lines:
                    lines.append(row)
                    line_count += 1
                else:
                    break
            return lines

    def read_raw(self):
        with open(self.uri) as result_file:
            return result_file.read()

    def end(self):
        pass

    @property
    def has_download_url(self):
        return False

    def get_download_url(self, custom_name=None):
        return None

    @property
    def uri(self):
        return self._uri
