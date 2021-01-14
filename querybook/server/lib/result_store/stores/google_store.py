from typing import List

from clients.google_client import (
    GoogleUploadClient,
    GoogleDownloadClient,
    GoogleKeySigner,
)
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import QuerybookSettings


class GoogleUploader(BaseUploader):
    def __init__(self, uri: str):
        self._uri = uri

    def start(self):
        self._uploader = GoogleUploadClient(
            QuerybookSettings.STORE_BUCKET_NAME, self.uri
        )
        self._uploader.start()

    def write(self, data: str) -> bool:
        self._uploader.write(data.encode())
        return True

    def end(self):
        self._uploader.stop()
        self._uploader = None

    @property
    def is_uploading(self):
        return self._uploader is not None

    @property
    def uri(self):
        return f"{QuerybookSettings.STORE_PATH_PREFIX}{self._uri}"


class GoogleReader(BaseReader):
    def __init__(self, uri: str):
        self._uri = uri
        self._reader = None

    def start(self):
        self._reader = GoogleDownloadClient(
            QuerybookSettings.STORE_BUCKET_NAME, self.uri
        )

    def read_csv(self, number_of_lines: int) -> List[List[str]]:
        return self._reader.read_csv(number_of_lines)

    def read_lines(self, number_of_lines: int) -> List[str]:
        return self._reader.read_lines(number_of_lines)

    def read_raw(self) -> str:
        # TODO: implement read raw for Google reader
        raise NotImplementedError()

    def end(self):
        self._reader = None

    @property
    def has_download_url(self):
        return True

    def get_download_url(self):
        key_signer = GoogleKeySigner(QuerybookSettings.STORE_BUCKET_NAME)
        download_url = key_signer.generate_presigned_url(self.uri)
        return download_url

    @property
    def uri(self):
        return f"{QuerybookSettings.STORE_PATH_PREFIX}{self._uri}"
