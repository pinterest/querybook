from abc import ABCMeta, abstractmethod
from typing import Generator, List
from logic import query_execution as logic
from lib.result_store import GenericReader


class BaseExporter(metaclass=ABCMeta):
    @property
    @abstractmethod
    def exporter_name(self) -> str:
        """Name of the exporter that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def exporter_type(self) -> str:
        # Can be one of 'url' | 'text' | 'none'
        # Url exports returns a url for user to open
        # Text exports opens up a copy paste modal for user to copy
        # None returns nothing since the result is exported without anything to track
        raise NotImplementedError()

    @property
    def requires_auth(self) -> bool:
        # Make this method return true if additional auth flow is needed for it to work
        return False

    def acquire_auth(self, uid: int) -> str:
        """Implement this method if requires_auth is True
           Use this method to redirect user to the oauth url

        Arguments:
            uid {int} -- [description]
        Returns:
            str -- Redirection url to the google oauth
            None -- if no redirection is needed
        """
        raise NotImplementedError()

    @property
    def export_form(self):
        """Return the form field for additional options for export
           Note that all options to be optional.
           Returns None if nothing is to be filled

        Returns:
            StructFormField -- The form value that indicates
                               the key value to enter
        """
        return None

    @abstractmethod
    def export(self, statement_execution_id: int, uid: int, **options) -> str:
        """This function exports the query results of statement_execution_id
           to given output
        Arguments:
            statement_execution_id {[number]}
            uid {[number]} -- user who requested access
            options {[Dict]} -- optional additional options, note they must be optional
                                since
        Returns:
            str -- String for frontend to display
                   Behavior noted by EXPORTER_TYPE
        """
        raise NotImplementedError()

    def _get_statement_execution_rows_len(
        self, statement_execution_id: int,
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        return statement_execution.result_row_count or 0

    def _get_statement_execution_columns_len(
        self, statement_execution_id: int,
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                csv = reader.read_csv(number_of_lines=1)
                if len(csv):
                    return len(csv[0])
        return 0

    def _get_statement_execution_result(
        self,
        statement_execution_id: int,
        number_of_lines: int = None,  # By default, read all lines
    ) -> Generator[List[List[str]], None, None]:
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(
                statement_execution.result_path,
                max_read_size=number_of_lines,  # override max_read_size in some readers
            ) as reader:
                return reader.get_csv_iter(number_of_lines=number_of_lines)
        return None

    def _get_statement_execution_download_url(self, statement_execution_id: int):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if reader.has_download_url:
                    return reader.get_download_url()
        return None

    def to_dict(self):
        return {
            "name": self.exporter_name,
            "type": self.exporter_type,
            "requires_auth": self.requires_auth,
            "form": self.export_form,
        }
