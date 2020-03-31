from abc import ABCMeta, abstractclassmethod
from logic import query_execution as logic
from lib.result_store import GenericReader


class BaseExporter(metaclass=ABCMeta):
    @abstractclassmethod
    def EXPORTER_NAME(cls) -> str:
        """Name of the exporter that will be shown on the frontend
        """
        raise NotImplementedError()

    @abstractclassmethod
    def EXPORTER_TYPE(cls):
        # Can be one of 'url' or 'text'
        # Both returns a string for upload but
        # Url exports returns a url for user to open
        # Text exports opens up a copy paste modal for user to copy
        raise NotImplementedError()

    @abstractclassmethod
    def export(cls, statement_execution_id: int, uid: int) -> str:
        """This function exports the query results of statement_execution_id
           to given output
        Arguments:
            statement_execution_id {[number]}
            uid {[number]} -- user who requested access
        Returns:
            str -- String for frontend to display
                   Behavior noted by EXPORTER_TYPE
        """
        raise NotImplementedError()

    @classmethod
    def get_statement_execution_result(
        cls,
        statement_execution_id: int,
        raw: bool = False,  # If raw, return unparsed csv text
    ):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if raw:
                    result = "\n".join(reader.read_lines(number_of_lines=2001))
                else:
                    result = reader.read_csv(number_of_lines=2001)
                return result
        return None

    @classmethod
    def get_statement_execution_download_url(cls, statement_execution_id: int):
        statement_execution = logic.get_statement_execution_by_id(
            statement_execution_id
        )
        if statement_execution.result_path:
            with GenericReader(statement_execution.result_path) as reader:
                if reader.has_download_url:
                    return reader.get_download_url()
        return None

    @classmethod
    def to_dict(cls):
        return {"name": cls.EXPORTER_NAME(), "type": cls.EXPORTER_TYPE()}
