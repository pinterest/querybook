import csv
import os
from lib.result_store.stores.base_store import BaseReader, BaseUploader
from env import DataHubSettings

# to use, enable docker volume inside docker-compose.yml
# uncomment lines `- file:/opt/store/`
# and the 'file' volume code @ bottom
# host path (currently '/mnt/datahub-store/') can be changed as desired
# RESULT_STORE_TYPE must be set to 'file'
# FILE_STORE_PATH must match the second path (currently '/opt/store/')


class FileUploader(BaseUploader):
    def __init__(self, uri: str):
        self._uri = uri
        if not os.path.exists("{}datahub_temp".format(DataHubSettings.FILE_STORE_PATH)):
            os.makedirs("{}datahub_temp".format(DataHubSettings.FILE_STORE_PATH))

    def start(self):
        self._chunks_length = 0
        os.makedirs(
            "{}datahub_temp/{}".format(
                DataHubSettings.FILE_STORE_PATH, self._uri.split("/")[1]
            )
        )

    def write(self, data: str):
        # write each line into csv
        data_len = len(data)
        if (
            DataHubSettings.DB_MAX_UPLOAD_SIZE > 0
            and self._chunks_length + data_len > DataHubSettings.DB_MAX_UPLOAD_SIZE
        ):
            return False

        self._chunks_length += data_len
        with open(self.uri, "a") as result_file:
            writer = csv.writer(result_file, delimiter=",")
            writer.writerow(data.split(","))
        return True

    def end(self):
        pass

    @property
    def uri(self):
        return f"{DataHubSettings.FILE_STORE_PATH}{self._uri}"


class FileReader(BaseReader):
    def __init__(self, uri: str):
        self._uri = uri

    def start(self):
        pass

    def read_csv(self, number_of_lines: int):
        with open(self.uri) as result_file:
            return result_file.read()

    def read_lines(self, number_of_lines: int):
        with open(self.uri) as result_file:
            lines = []
            line_count = 0
            for row in result_file:
                if line_count < number_of_lines:
                    lines.append(row[:-1])
                    line_count += 1
                else:
                    break
            return lines

    def read_raw(self):
        with open(self.uri) as result_file:
            reader = csv.reader(result_file)
            raw_text = ""
            for row in reader:
                raw_text += ",".join(row)
                raw_text += "\n"
            return raw_text

    def end(self):
        pass

    @property
    def has_download_url(self):
        return False

    def get_download_url(self):
        return None

    @property
    def uri(self):
        return f"{DataHubSettings.FILE_STORE_PATH}{self._uri}"
