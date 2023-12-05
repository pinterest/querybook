from abc import ABCMeta, abstractmethod
from typing import Generator, List
from app.db import with_session
from env import QuerybookSettings
from lib.logger import get_logger
from logic import query_execution as logic
from lib.result_store import GenericReader
from logic.query_execution_permission import (
    get_default_user_environment_by_execution_id,
)


LOG = get_logger(__file__)


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

    @with_session
    def _get_statement_execution_num_rows(
        self,
        statement_execution_id: int,
        session=None,
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id,
            session=session,
        )
        return statement_execution.result_row_count or 0

    @with_session
    def _get_statement_execution_cols(
        self,
        statement_execution_id: int,
        session=None,
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id,
            session=session,
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                csv = reader.read_csv(number_of_lines=1)
                if len(csv) > 0:
                    return csv[0]
        return None

    @with_session
    def _get_statement_execution_num_cols(
        self,
        statement_execution_id: int,
        session=None,
    ):
        cols = self._get_statement_execution_cols(
            statement_execution_id, session=session
        )
        return len(cols) if cols is not None else 0

    def _get_statement_execution_result(
        self,
        statement_execution_id: int,
        raw: bool = False,  # If raw, return unparsed csv text
        number_of_lines: int = 2001,
    ):
        LOG.warning(
            "_get_statement_execution_result will be deprecated since we are moving towards exporting full statement execution results"
        )
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if raw:
                    result = "\n".join(
                        reader.read_lines(number_of_lines=number_of_lines)
                    )
                else:
                    result = reader.read_csv(number_of_lines=number_of_lines)
                return result
        return None

    @with_session
    def _get_statement_execution_result_iter(
        self,
        statement_execution_id: int,
        number_of_lines: int = None,  # By default, read all lines
        session=None,
    ) -> Generator[List[List[str]], None, None]:
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id, session
        )
        if statement_execution.result_path:
            with GenericReader(
                statement_execution.result_path,
                max_read_size=None,  # override max_read_size in some readers
            ) as reader:
                return reader.get_csv_iter(number_of_lines=number_of_lines)
        return iter(())

    def _get_statement_execution_download_url(self, statement_execution_id: int):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if reader.has_download_url:
                    return reader.get_download_url()
        return None

    @with_session
    def _get_query_execution_url_by_statement_id(
        self, statement_execution_id: int, uid: int, session=None
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id, session=session
        )
        query_execution_id = statement_execution.query_execution_id

        env = get_default_user_environment_by_execution_id(
            query_execution_id, uid, session=session
        )
        return (
            f"{QuerybookSettings.PUBLIC_URL}/{env.name}/query_execution/{query_execution_id}/"
            if env
            else None
        )

    def to_dict(self):
        return {
            "name": self.exporter_name,
            "type": self.exporter_type,
            "requires_auth": self.requires_auth,
            "form": self.export_form,
        }
