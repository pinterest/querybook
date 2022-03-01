from abc import ABCMeta, abstractmethod
from logic import query_execution as logic
from lib.result_store import GenericReader
from logic.result_store import string_to_csv


class BaseExporter(metaclass=ABCMeta):
    @property
    @abstractmethod
    def exporter_name(self) -> str:
        """Name of the exporter that will be shown on the frontend
        """
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
        return None

    def _get_statement_execution_result(
        self,
        statement_execution_id: int,
        raw: bool = False,  # If raw, return unparsed csv text
        number_of_lines: int = None,  # By default, read all lines
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if number_of_lines is None:
                    try:
                        result = reader.read_raw()
                        if not raw:
                            result = string_to_csv(result)
                        return result
                    except NotImplementedError:
                        # Readers in which `read_raw` is not implemented (i.e. GoogleReader, S3Reader)
                        # can support reading all lines in `read_lines` with number_of_lines=None
                        pass
                if raw:
                    result = "\n".join(
                        reader.read_lines(number_of_lines=number_of_lines)
                    )
                else:
                    result = reader.read_csv(number_of_lines=number_of_lines)
                return result
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
