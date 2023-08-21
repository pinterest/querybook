import functools
from abc import ABC, abstractmethod

from app.db import with_session
from const.ai_assistant import AICommandType
from langchain.chains import LLMChain
from lib.logger import get_logger
from lib.query_analysis.lineage import process_query
from lib.vector_store import get_vector_store
from logic import admin as admin_logic
from logic import query_execution as qe_logic
from models.metastore import DataTableColumn
from models.query_execution import QueryExecution
from pydantic.error_wrappers import ValidationError

from .ai_socket import with_ai_socket
from .prompts.sql_fix_prompt import SQL_FIX_PROMPT
from .prompts.sql_title_prompt import SQL_TITLE_PROMPT
from .prompts.sql_to_text_prompt import SQL_TO_TEXT_PROMPT
from .prompts.table_summary_prompt import TABLE_SUMMARY_PROMPT
from .prompts.text2sql_prompt import TEXT2SQL_PROMPT
from .streaming_web_socket_callback_handler import StreamingWebsocketCallbackHandler
from .tools.table import (
    get_table_schema_prompt_by_id,
    get_table_schemas_prompt_by_ids,
    get_table_schemas_prompt_by_names,
)


LOG = get_logger(__file__)


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

    @abstractmethod
    def _get_llm(self, callback_handler: StreamingWebsocketCallbackHandler = None):
        """return the language model to use"""

    def _get_sql_title_prompt(self):
        return SQL_TITLE_PROMPT

    def _get_text2sql_prompt(self):
        return TEXT2SQL_PROMPT

    def _get_sql_fix_prompt(self):
        return SQL_FIX_PROMPT

    def _get_table_summary_prompt(self):
        return TABLE_SUMMARY_PROMPT

    def _get_sql_summary_prompt(self):
        return SQL_TO_TEXT_PROMPT

    def _get_llm_chain(self, prompt, socket):
        callback_handler = StreamingWebsocketCallbackHandler(socket)
        llm = self._get_llm(callback_handler=callback_handler)
        return LLMChain(llm=llm, prompt=prompt)

    def _get_error_msg(self, error) -> str:
        """Override this method to return specific error messages for your own assistant."""
        if isinstance(error, ValidationError):
            return error.errors()[0].get("msg")

        return str(error.args[0])

    def _should_skip_column(self, column: DataTableColumn) -> bool:
        """Override this method to filter out columns that are not needed."""
        return False

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
    @with_ai_socket(command_type=AICommandType.TEXT_TO_SQL)
    def generate_sql_query(
        self,
        query_engine_id: int,
        tables: list[str],
        question: str,
        original_query: str = None,
        socket=None,
        session=None,
    ):
        if not tables:
            tables = get_vector_store().search_tables(question)
            if tables:
                socket.send_tables(tables)

        # not finding any relevant tables
        if not tables:
            # ask user to provide table names
            socket.send_data(
                "Sorry, I can't find any relevant tables by the given context. Please provide table names above."
            )
            socket.close()
            return

        query_engine = admin_logic.get_query_engine_by_id(
            query_engine_id, session=session
        )
        table_schemas = get_table_schemas_prompt_by_names(
            metastore_id=query_engine.metastore_id,
            full_table_names=tables,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_text2sql_prompt()
        chain = LLMChain(
            llm=self._get_llm(
                callback_handler=StreamingWebsocketCallbackHandler(socket)
            ),
            prompt=prompt,
        )
        return chain.run(
            dialect=query_engine.language,
            question=question,
            table_schemas=table_schemas,
            original_query=original_query,
        )

    @catch_error
    @with_ai_socket(command_type=AICommandType.SQL_TITLE)
    def generate_title_from_query(self, query, socket=None):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        prompt = self._get_sql_title_prompt()
        chain = LLMChain(
            llm=self._get_llm(
                callback_handler=StreamingWebsocketCallbackHandler(socket)
            ),
            prompt=prompt,
        )
        return chain.run(query=query)

    @catch_error
    @with_session
    @with_ai_socket(command_type=AICommandType.SQL_FIX)
    def query_auto_fix(
        self,
        query_execution_id: int,
        socket=None,
        session=None,
    ):
        """Generate title from SQL query.

        Args:
            query_execution_id (int): The failed query execution id
        """
        query_execution = qe_logic.get_query_execution_by_id(
            query_execution_id, session=session
        )
        query = query_execution.query
        language = query_execution.engine.language

        # get table names
        table_names, _ = process_query(query=query, language=language)

        metastore_id = query_execution.engine.metastore_id
        table_schemas = get_table_schemas_prompt_by_names(
            metastore_id=metastore_id,
            full_table_names=[
                table for statement_tables in table_names for table in statement_tables
            ],
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_sql_fix_prompt()
        chain = LLMChain(
            llm=self._get_llm(
                callback_handler=StreamingWebsocketCallbackHandler(socket)
            ),
            prompt=prompt,
        )
        return chain.run(
            dialect=language,
            query=query_execution.query,
            error=self._get_query_execution_error(query_execution),
            table_schemas=table_schemas,
        )

    @catch_error
    @with_session
    def summarize_table(
        self,
        table_id: int,
        session=None,
    ):
        """Generate an informative summary of the table."""

        table_schema = get_table_schema_prompt_by_id(
            table_id=table_id,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_table_summary_prompt()
        llm = self._get_llm(callback_handler=None)
        chain = LLMChain(llm=llm, prompt=prompt)
        return chain.run(table_schema=table_schema)

    @catch_error
    @with_session
    def summarize_query(
        self,
        query: str,
        table_ids: list[int],
        session=None,
    ):
        """Generate an informative summary of the query."""

        table_schemas = get_table_schemas_prompt_by_ids(
            table_ids=table_ids,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_sql_summary_prompt()
        llm = self._get_llm(callback_handler=None)
        chain = LLMChain(llm=llm, prompt=prompt)
        return chain.run(table_schemas=table_schemas, query=query)
