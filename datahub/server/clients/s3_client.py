from collections import deque
from itertools import islice
from typing import List

import boto3
import botocore

from env import DataHubSettings
from logic.result_store import string_to_csv

LINE_TERMINATOR = "\n"


class FileDoesNotExist(Exception):
    pass


class MultiPartUploader(object):
    def __init__(self, bucket_name, key):
        self._bucket_name = bucket_name
        self._key = key
        self._s3 = boto3.client("s3")
        self._mpu = self._s3.create_multipart_upload(Bucket=bucket_name, Key=key)
        self._parts = []
        self._part_number = 1

        self.chunk = []
        self.chunk_datasize = 0
        self.is_first_upload = True

    def _upload_part(self, body):
        if self._part_number > DataHubSettings.S3_MAX_UPLOAD_CHUNK_NUM:
            return

        part = self._s3.upload_part(
            Bucket=self._bucket_name,
            Key=self._key,
            PartNumber=self._part_number,
            UploadId=self._mpu["UploadId"],
            Body=body,
        )

        self._parts.append(
            {"PartNumber": self._part_number, "ETag": part["ETag"].replace('"', "")}
        )
        self._part_number += 1

    def write(self, string: str) -> bool:
        """Write a string to upload

        Arguments:
            string {str} -- the string to upload

        Returns:
            bool -- Whether or not the upload is successful
        """
        if self._part_number > DataHubSettings.S3_MAX_UPLOAD_CHUNK_NUM:
            return False

        self.chunk.append(string)
        self.chunk_datasize += len(string)
        if self.chunk_datasize > DataHubSettings.S3_MIN_UPLOAD_CHUNK_SIZE:
            self._upload_part("".join(self.chunk))
            self.chunk = []
            self.chunk_datasize = 0
        return True

    def write_line(self, string: str):
        self.write(string + "\n")

    def complete(self):
        if len(self.chunk) > 0:
            self._upload_part("".join(self.chunk))
        self._s3.complete_multipart_upload(
            Bucket=self._bucket_name,
            Key=self._key,
            UploadId=self._mpu["UploadId"],
            MultipartUpload={"Parts": self._parts},
        )


class S3KeySigner(object):
    def __init__(self, bucket_name):
        self._bucket_name = bucket_name
        self._s3 = boto3.client("s3")
        self._bucket = boto3.resource("s3").Bucket(bucket_name)

    def generate_presigned_url(
        self, key, method="get_object", expires_in=86400, params={}
    ):
        params.update({"Bucket": self._bucket_name, "Key": key})

        # Check if file exists
        objects = list(self._bucket.objects.filter(Prefix=key))
        if len(objects) > 0 and objects[0].key == key:
            url = self._s3.generate_presigned_url(
                ClientMethod=method, Params=params, ExpiresIn=expires_in
            )
            return url
        return None


class S3FileReader(object):
    def __init__(
        self,
        bucket_name,
        key,
        read_size=DataHubSettings.S3_READ_SIZE,
        max_read_size=DataHubSettings.S3_MAX_READ_SIZE,
    ):
        self._bucket_name = bucket_name
        self._key = key

        # The chunk read size
        self._read_size = read_size
        # Max number of chars we will read
        self._max_read_size = max_read_size

        self._num_char_read = 0
        self._eof = False
        self._buffer_deque = deque([])
        self._raw_buffer = ""

        # Now connect to s3 using boto3
        try:
            self._s3 = boto3.resource("s3")
            self._object = self._s3.Object(self._bucket_name, key)
            self._body = self._object.get()["Body"]
        except botocore.exceptions.ClientError as e:
            if e.response["Error"]["Code"] == "NoSuchKey":
                raise FileDoesNotExist(
                    "{}/{} does not exist".format(self._bucket_name, key)
                )
            else:
                raise e

    def read_csv(self, number_of_lines=None):
        raw_csv_str = "\n".join(
            [line for line in islice(self.read_line(), number_of_lines)]
        )
        return string_to_csv(raw_csv_str)

    def read_lines(self, number_of_lines=None) -> List[str]:
        return [line for line in islice(self.read_line(), number_of_lines)]

    def read_line(self):  # generator
        while (not self._eof) or len(self._buffer_deque):
            if len(self._buffer_deque) > 0:
                yield self._buffer_deque.popleft()
            elif not self._eof:
                self._fill_buffer()

    def _fill_buffer(self):
        raw = self._body.read(self._read_size).decode("utf-8")
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
            self._buffer_deque.append(self._raw_buffer)
