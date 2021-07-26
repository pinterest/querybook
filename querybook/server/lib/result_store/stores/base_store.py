from abc import ABC, abstractmethod
from typing import List


class BaseUploader(ABC):
    """Base interface for result uploader
    """

    @abstractmethod
    def __init__(self, uri: str):
        pass

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end()

    @abstractmethod
    def start(self):
        """Start the upload process

        Arguments:
            uri {str} -- uniquely identifies the resource
        """

        pass

    @abstractmethod
    def write(self, data: str) -> bool:
        """Upload part of the string

        Arguments:
            data {str} -- Part of the string to upload

        Returns:
            bool -- Whether or not the upload was successful
        """

        pass

    @abstractmethod
    def end(self):
        """Finish the upload
        """
        pass


class BaseReader(ABC):
    @abstractmethod
    def __init__(self, uri: str):
        pass

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.end()

    @abstractmethod
    def start(self) -> None:
        """Start the reader process

        Returns:
            None -- None
        """

        pass

    @abstractmethod
    def read_csv(self, number_of_lines: int) -> List[List[str]]:
        """Uses the read_raw method and then parses to csv

        Arguments:
            number_of_lines {int} -- The number lines of csv to return

        Returns:
            List[List[str]] -- the parsed csv
        """
        pass

    @abstractmethod
    def read_lines(self, number_of_lines: int) -> List[str]:
        """Read the string file per line

        Arguments:
            number_of_lines {int} -- the number of lines to return

        Returns:
            List[str] -- the parsed file
        """
        pass

    @abstractmethod
    def read_raw(self) -> str:
        """Read the entire string as raw

        Arguments:

        Returns:
            str -- the raw file
        """
        pass

    @abstractmethod
    def end(self):
        """End the reading process
        """
        pass

    @property
    @abstractmethod
    def has_download_url(self):
        """Indicates if this reader can generate a download url
        """
        pass

    @abstractmethod
    def get_download_url(self, custom_name=None) -> str:
        """Get the download url as string

        Args:
            custom_name (str, optional): Optional name for the file downloaded. You may ignore this field if you don't intend to rename the download. Defaults to None.
        Returns:
            str: the downloadable url
        """
        pass
