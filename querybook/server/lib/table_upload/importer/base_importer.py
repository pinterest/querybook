from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Tuple
from pandas import DataFrame
from lib.table_upload.common import ImporterResourceType


class BaseTableUploadImporter(ABC):
    def __init__(self, data: Any, import_config: Optional[Dict] = None):
        """
        Args:
            data (Any): This represents the resource itself. For example, it could be the File object,
                        The query execution id, the Google sheets URL, etc
            import_config (Optional[Dict]): The optional config is to tell the importer how to read the data
                                            It could be the CSV format, etc.
        """
        self.data = data
        self.import_config = import_config

    def get_resource_path(self) -> Tuple[ImporterResourceType, Any]:
        """Return a remote location where the data can be read.
           For example, if importing data from a query execution that is stored on S3,
           this should return something along the lines of
           [ImporterResourceType.S3, 'key/file.csv']

        Returns:
            Tuple[ImporterResourceType, Any]: Resource type,
        """
        return [None, None]

    @abstractmethod
    def get_pandas_df(self) -> DataFrame:
        """
        Override this method to return a data frame that contains the data

        Returns:
            DataFrame: data represented data frame
        """
        raise NotImplementedError()

    @abstractmethod
    def get_columns(self) -> List[Tuple[str, str]]:
        """
        Override this method to get column names and types for the data

        Returns:
            List[Tuple[str, str]]: List of [col name, col type pair]
                                   col types
        """
        raise NotImplementedError()
