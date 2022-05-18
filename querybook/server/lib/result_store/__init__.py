from typing import Generator, List, Optional

from .all_result_stores import ALL_RESULT_STORES
from .stores.base_store import BaseReader, BaseUploader
from env import QuerybookSettings


class GenericUploader(BaseUploader):
    def __init__(self, uri):
        self._uri = uri
        self._uri_with_store_type = "{}://{}".format(
            QuerybookSettings.RESULT_STORE_TYPE, uri
        )
        self._uploader = ALL_RESULT_STORES[
            QuerybookSettings.RESULT_STORE_TYPE
        ].uploader(uri)

    def start(self) -> None:
        self._uploader.start()

    def write(self, data: str) -> bool:
        return self._uploader.write(data)

    def end(self):
        self._uploader.end()
        self._uploader = None

    @property
    def is_uploading(self):
        return self._uploader.is_uploading

    @property
    def upload_url(self):
        return self._uri_with_store_type


class GenericReader(BaseReader):
    def __init__(self, uri: str, **kwargs):
        store_type, uri_suffix = uri.split("://")
        self.store_type = store_type
        self._reader: BaseReader = ALL_RESULT_STORES[store_type].reader(
            uri_suffix, **kwargs
        )

    def start(self):
        self._reader.start()

    def get_csv_iter(
        self, number_of_lines: Optional[int]
    ) -> Generator[List[List[str]], None, None]:
        return self._reader.get_csv_iter(number_of_lines)

    def read_lines(self, number_of_lines: int) -> List[str]:
        return self._reader.read_lines(number_of_lines)

    def read_raw(self) -> str:
        return self._reader.read_raw()

    @property
    def has_download_url(self):
        return self._reader.has_download_url

    def get_download_url(self, custom_name=None) -> str:
        return self._reader.get_download_url(custom_name=custom_name)

    def end(self):
        self._reader.end()
        self._reader = None

    @property
    def uri(self):
        return self._reader.uri
