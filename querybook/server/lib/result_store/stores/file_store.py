import csv
from itertools import islice
import os
from typing import Optional
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import QuerybookSettings

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
        self._chunks_length = 0
        os.makedirs(self.uri_dir_path, exist_ok=True)

    def write(self, data: str):
        # write each line into csv
        data_len = len(data)
        if (
            QuerybookSettings.DB_MAX_UPLOAD_SIZE > 0
            and self._chunks_length + data_len > QuerybookSettings.DB_MAX_UPLOAD_SIZE
        ):
            return False

        self._chunks_length += data_len
        with open(self.uri, "a") as result_file:
            result_file.write(data)
        return True

    def end(self):
        pass

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
        with open(self.uri) as result_file:
            reader = csv.reader(result_file)
            return islice(reader, number_of_lines)

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
