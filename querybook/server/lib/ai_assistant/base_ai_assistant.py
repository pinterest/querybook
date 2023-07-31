from abc import ABC, abstractmethod
import functools
import json
import queue

from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from pydantic.error_wrappers import ValidationError

from app.db import with_session
from lib.logger import get_logger
from logic import query_execution as qe_logic
from lib.query_analysis.lineage import process_query
from logic import admin as admin_logic
from logic import metastore as m_logic
from models.query_execution import QueryExecution
from models.metastore import DataTableColumn

LOG = get_logger(__file__)


class EventStream:
    """Generator to facilitate streaming result from Langchain.
    The stream format is based on Server-Sent Events (SSE)."""

    def __init__(self):
        self.queue = queue.Queue()

    def __iter__(self):
        return self

    def __next__(self):
        item = self.queue.get()
        if item is StopIteration:
            raise item
        return item

    def send(self, data: str):
        self.queue.put("data: " + json.dumps({"data": data}) + "\n\n")

    def close(self):
        # the empty data is to make sure the client receives the close event
        self.queue.put("event: close\ndata: \n\n")
        self.queue.put(StopIteration)

    def send_error(self, error: str):
        self.queue.put("event: error\n")
        data = json.dumps({"data": error})
        self.queue.put(f"data: {data}\n\n")
        self.close()


class ChainStreamHandler(StreamingStdOutCallbackHandler):
    """Callback handlder to stream the result to a generator."""

    def __init__(self, stream: EventStream):
        super().__init__()
        self.stream = stream

    def on_llm_new_token(self, token: str, **kwargs):
        self.stream.send(token)

    def on_llm_end(self, response, **kwargs):
        self.stream.close()


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    def set_config(self, config: dict):
        self._config = config

    def catch_error(func):
        @functools.wraps(func)
        def wrapper(self, *args, **kwargs):
            try:
                return func(self, *args, **kwargs)
            except Exception as e:
                LOG.error(e, exc_info=True)
                err_msg = self._get_error_msg(e)
                callback_handler = kwargs.get("callback_handler")
                if callback_handler:
                    callback_handler.stream.send_error(err_msg)
                else:
                    raise Exception(err_msg) from e

        return wrapper

    def _get_error_msg(self, error) -> str:
        """Override this method to return specific error messages for your own assistant."""
        if isinstance(error, ValidationError):
            return error.errors()[0].get("msg")

        return str(error.args[0])

    def _should_skip_column(self, column: DataTableColumn) -> bool:
        """Override this method to filter out columns that are not needed."""
        return False

    @with_session
    def _generate_table_schema_prompt(
        self, metastore_id, table_names: list[str], session=None
    ) -> str:
        """Generate prompt for table schema. The format will be like:

        Table Name: [Name_of_table_1]
        Description: [Brief_general_description_of_Table_1]
        Columns:
        - Column Name: [Column1_name]
          Data Type: [Column1_data_type]
          Description: [Brief_description_of_the_column1_purpose]
        - Column Name: [Column2_name]
          Data Type: [Column2_data_type]
          Description: [Brief_description_of_the_column2_purpose]

        Table Name: [Name_of_table_2]
        Description: [Brief_general_description_of_Table_2]
        Columns:
        - Column Name: [Column1_name]
          Data Type: [Column1_data_type]
          Description: [Brief_description_of_the_column1_purpose]
        - Column Name: [Column2_name]
          Data Type: [Column2_data_type]
          Description: [Brief_description_of_the_column2_purpose]
        """
        prompt = ""
        for full_table_name in table_names:
            table_schema, table_name = full_table_name.split(".")
            table = m_logic.get_table_by_name(
                schema_name=table_schema,
                name=table_name,
                metastore_id=metastore_id,
                session=session,
            )
            if not table:
                continue
            table_description = table.information.description or ""
            prompt += f"Table Name: {full_table_name}\n"
            prompt += f"Description: {table_description}\n"
            prompt += "Columns:\n"
            for column in table.columns:
                if self._should_skip_column(column):
                    continue

                prompt += f"- Column Name: {column.name}\n"
                prompt += f"  Data Type: {column.type}\n"
                if column.description:
                    prompt += f"  Description: {column.description}\n"
                elif column.data_elements:
                    # use data element's description when column's description is empty
                    # TODO: only handling the REF data element for now. Need to handle ARRAY, MAP and etc in the future.
                    prompt += f"  Description: {column.data_elements[0].description}\n"
                    prompt += f"  Data Element: {column.data_elements[0].name}\n"

            prompt += "\n"

        return prompt

    def _get_query_execution_error(self, query_execution: QueryExecution) -> str:
        """Get error message from query execution. If the error message is too long, only return the first 1000 characters."""
        error = (
            query_execution.error.error_message_extracted
            or query_execution.error.error_message
            or ""
        )

        return error[:1000]

    @catch_error
    @with_session
    def generate_sql_query(
        self,
        query_engine_id: int,
        tables: list[str],
        question: str,
        original_query: str = None,
        stream=True,
        callback_handler: ChainStreamHandler = None,
        user_id=None,
        session=None,
    ):
        query_engine = admin_logic.get_query_engine_by_id(
            query_engine_id, session=session
        )
        table_schemas = self._generate_table_schema_prompt(
            metastore_id=query_engine.metastore_id, table_names=tables, session=session
        )
        return self._generate_sql_query(
            language=query_engine.language,
            table_schemas=table_schemas,
            question=question,
            original_query=original_query,
            stream=stream,
            callback_handler=callback_handler,
            user_id=user_id,
        )

    @abstractmethod
    def _generate_sql_query(
        self,
        language: str,
        table_schemas: str,
        question: str,
        original_query: str = None,
        stream=True,
        callback_handler: ChainStreamHandler = None,
        user_id=None,
    ):
        raise NotImplementedError()

    @catch_error
    def generate_title_from_query(
        self,
        query,
        stream=True,
        callback_handler: ChainStreamHandler = None,
        user_id=None,
    ):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        return self._generate_title_from_query(
            query=query,
            stream=stream,
            callback_handler=callback_handler,
            user_id=user_id,
        )

    @abstractmethod
    def _generate_title_from_query(
        self,
        query,
        stream,
        callback_handler,
        user_id=None,
    ):
        raise NotImplementedError()

    @catch_error
    @with_session
    def query_auto_fix(
        self,
        query_execution_id: int,
        stream: bool = True,
        callback_handler: ChainStreamHandler = None,
        user_id: int = None,
        session=None,
    ):
        """Generate title from SQL query.

        Args:
            query_execution_id (int): The failed query execution id
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        query = query_execution.query
        language = query_execution.engine.language

        # get table names
        table_names, _ = process_query(query=query, language=language)

        metastore_id = query_execution.engine.metastore_id
        table_schemas = self._generate_table_schema_prompt(
            metastore_id=metastore_id,
            table_names=[
                table for statement_tables in table_names for table in statement_tables
            ],
            session=session,
        )

        return self._query_auto_fix(
            language=language,
            query=query_execution.query,
            error=self._get_query_execution_error(query_execution),
            table_schemas=table_schemas,
            stream=stream,
            callback_handler=callback_handler,
            user_id=user_id,
        )

    @abstractmethod
    def _query_auto_fix(
        self,
        language: str,
        query: str,
        error: str,
        table_schemas: str,
        stream: bool,
        callback_handler: ChainStreamHandler,
        user_id=None,
    ):
        raise NotImplementedError()
