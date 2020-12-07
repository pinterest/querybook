from typing import List

from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import SiteSettings
from clients.s3_client import MultiPartUploader, S3FileReader, S3KeySigner


class S3Uploader(BaseUploader):
    def __init__(self, uri: str):
        self._uploader = None
        self._uri = uri

    def start(self):
        self._uploader = MultiPartUploader(SiteSettings.STORE_BUCKET_NAME, self.uri)

    def write(self, data: str) -> bool:
        return self._uploader.write(data)

    def end(self):
        self._uploader.complete()
        self._uploader = None

    @property
    def is_uploading(self):
        return self._uploader is not None

    @property
    def uri(self):
        return f"{SiteSettings.STORE_PATH_PREFIX}{self._uri}"


class S3Reader(BaseReader):
    def __init__(self, uri: str):
        self._uri = uri
        self._reader = None

    def start(self):
        self._reader = S3FileReader(SiteSettings.STORE_BUCKET_NAME, self.uri)

    def read_csv(self, number_of_lines: int) -> List[List[str]]:
        return self._reader.read_csv(number_of_lines)

    def read_lines(self, number_of_lines: int) -> List[str]:
        return self._reader.read_lines(number_of_lines)

    def read_raw(self) -> str:
        # TODO: implement read raw for s3 reader
        raise NotImplementedError()

    def end(self):
        self._reader = None

    @property
    def has_download_url(self):
        return True

    def get_download_url(self):
        key_signer = S3KeySigner(SiteSettings.STORE_BUCKET_NAME)
        download_url = key_signer.generate_presigned_url(self.uri)
        return download_url

    @property
    def uri(self):
        return f"{SiteSettings.STORE_PATH_PREFIX}{self._uri}"
