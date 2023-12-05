from io import BytesIO
from os import SEEK_END
from datetime import datetime
from urllib.parse import quote

import requests

from env import QuerybookSettings
from .common import ChunkReader, FileDoesNotExist
from lib.utils.utils import DATETIME_TO_UTC


def get_google_credentials(creds_info=None):
    try:
        from google.oauth2 import service_account
    except ImportError:
        raise Exception(
            "google.oauth2 is not installed. "
            + "Please make sure it is installed"
            + "to use any of the google services"
        )

    cred_to_use = creds_info or QuerybookSettings.GOOGLE_CREDS

    if cred_to_use is not None:
        return service_account.Credentials.from_service_account_info(cred_to_use)
    else:
        return None


GOOGLE_AUTH_CONFIG = "https://accounts.google.com/.well-known/openid-configuration"
_cached_google_oauth_config = None


def get_google_oauth_config():
    global _cached_google_oauth_config
    if _cached_google_oauth_config is None:
        _cached_google_oauth_config = requests.get(GOOGLE_AUTH_CONFIG).json()
    return _cached_google_oauth_config


# Reference used: https://dev.to/sethmlarson/python-data-streaming-to-google-cloud-storage-with-resumable-uploads-458h
class GoogleUploadClient(object):
    def __init__(
        self,
        bucket_name: str,
        blob_name: str,
    ):
        from google.cloud import storage
        from google.auth.transport import requests

        cred = get_google_credentials()
        self._client = storage.Client(project=cred.project_id, credentials=cred)
        self._bucket = self._client.bucket(bucket_name)
        self._blob = self._bucket.blob(blob_name)

        self._chunk_size = QuerybookSettings.STORE_MIN_UPLOAD_CHUNK_SIZE

        self._transport = requests.AuthorizedSession(
            credentials=self._client._credentials
        )
        self._request = None  # type: requests.ResumableUpload

    def start(self):
        from google.resumable_media.requests import ResumableUpload

        self._stream = BytesIO()
        self._bytes_written = 0

        url = (
            f"https://www.googleapis.com/upload/storage/v1/b/"
            f"{self._bucket.name}/o?uploadType=resumable"
        )
        self._request = ResumableUpload(upload_url=url, chunk_size=self._chunk_size)
        self._request.initiate(
            transport=self._transport,
            content_type="application/octet-stream",
            stream=self._stream,
            stream_final=False,
            metadata={"name": self._blob.name},
        )

    def stop(self):
        self._request.transmit_next_chunk(self._transport)

    def write(self, data: bytes):
        from google.resumable_media import common

        # Get the current stream pos
        cur_pos = self._stream.tell()

        # Move cursor to end for writing
        self._stream.seek(0, SEEK_END)
        data_len = len(data)
        self._stream.write(data)

        # Move it back to original position
        self._stream.seek(cur_pos)
        self._bytes_written += data_len

        bytes_in_buffer = self._bytes_written - self._stream.tell()
        while bytes_in_buffer > self._chunk_size:
            try:
                self._request.transmit_next_chunk(self._transport)
            except common.InvalidResponse:
                self._request.recover(self._transport)
            bytes_in_buffer = self._bytes_written - self._stream.tell()
        return data_len


class GoogleDownloadClient(ChunkReader):
    def __init__(
        self,
        bucket_name,
        blob_name,
        read_size=QuerybookSettings.STORE_READ_SIZE,
        max_read_size=QuerybookSettings.STORE_MAX_READ_SIZE,
    ):
        from google.cloud import storage
        from google.auth.transport.requests import AuthorizedSession
        from google.resumable_media.requests import ChunkedDownload

        # First check for existence
        cred = get_google_credentials()
        client = storage.Client(project=cred.project_id, credentials=cred)
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_name)
        if not blob.exists():
            raise FileDoesNotExist(
                "{}/{} does not exist".format(bucket_name, blob_name)
            )

        # Start the transport process
        self._transport = AuthorizedSession(credentials=client._credentials)
        self._stream = BytesIO()

        download_url = (
            f"https://storage.googleapis.com/storage/v1/b/"
            f"{bucket_name}/o/{quote(blob_name, safe='')}?alt=media"
        )

        self._download = ChunkedDownload(download_url, read_size, self._stream)

        super(GoogleDownloadClient, self).__init__(read_size, max_read_size)

    def read(self):
        if self._download.finished:
            return ""
        self._download.consume_next_chunk(self._transport)
        self._stream.seek(0)
        content = self._stream.read()

        # Clean up the stream
        self._stream.seek(0)
        self._stream.truncate(0)

        return content.decode("utf-8")


class GoogleKeySigner(object):
    def __init__(self, bucket_name):
        from google.cloud import storage

        cred = get_google_credentials()
        self._client = storage.Client(project=cred.project_id, credentials=cred)
        self._bucket = self._client.bucket(bucket_name)

    def generate_presigned_url(
        self, blob_name, method="GET", expires_in=86400, params={}
    ):
        blob = self._bucket.blob(blob_name)
        if blob.exists():
            return blob.generate_signed_url(
                expiration=expires_in + DATETIME_TO_UTC(datetime.utcnow()),
                method=method,
                **params,
            )
        return None
