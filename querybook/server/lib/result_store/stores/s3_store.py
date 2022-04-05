from typing import Generator, List, Optional

from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import QuerybookSettings
from clients import s3_client  # Needed to patch S3FileReader in tests
from clients.s3_client import MultiPartUploader, S3KeySigner


class S3Uploader(BaseUploader):
    def __init__(self, uri: str):
        self._uploader = None
        self._uri = uri

    def start(self):
        self._uploader = MultiPartUploader(
            QuerybookSettings.STORE_BUCKET_NAME, self.uri
        )

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
        return f"{QuerybookSettings.STORE_PATH_PREFIX}{self._uri}"


class S3Reader(BaseReader):
    def __init__(self, uri: str, **kwargs):
        self._uri = uri
        self._kwargs = kwargs
        self._reader = None

    def start(self):
        reader_kwargs = {}
        if "max_read_size" in self._kwargs:
            reader_kwargs["max_read_size"] = self._kwargs.get("max_read_size")
        self._reader = s3_client.S3FileReader(
            QuerybookSettings.STORE_BUCKET_NAME,
            self.uri,
            **reader_kwargs,
        )

    def get_csv_iter(
        self, number_of_lines: Optional[int]
    ) -> Generator[List[List[str]], None, None]:
        return self._reader.get_csv_iter(number_of_lines)

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

    def get_download_url(self, custom_name=None):
        url_params = {}
        if custom_name is not None:
            url_params[
                "ResponseContentDisposition"
            ] = f'attachment; filename="{custom_name}"'

        key_signer = S3KeySigner(QuerybookSettings.STORE_BUCKET_NAME)
        download_url = key_signer.generate_presigned_url(
            self.uri,
            params=url_params,
        )
        return download_url

    @property
    def uri(self):
        return f"{QuerybookSettings.STORE_PATH_PREFIX}{self._uri}"
