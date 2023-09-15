import functools
import json
from abc import ABC, abstractmethod

from app.db import with_session
from const.ai_assistant import (
    AICommandType,
    DEFAUTL_TABLE_SELECT_LIMIT,
    MAX_SAMPLE_QUERY_COUNT_FOR_TABLE_SUMMARY,
)
from langchain.chains import LLMChain
from lib.logger import get_logger
from lib.query_analysis.lineage import process_query
from lib.vector_store import get_vector_store
from logic import admin as admin_logic
from logic import query_execution as qe_logic
from logic.elasticsearch import get_sample_query_cells_by_table_name
from logic.metastore import get_table_by_name
from models.metastore import DataTableColumn
from models.query_execution import QueryExecution
from pydantic.error_wrappers import ValidationError

from .ai_socket import with_ai_socket
from .prompts.sql_fix_prompt import SQL_FIX_PROMPT
from .prompts.sql_summary_prompt import SQL_SUMMARY_PROMPT
from .prompts.sql_title_prompt import SQL_TITLE_PROMPT
from .prompts.table_select_prompt import TABLE_SELECT_PROMPT
from .prompts.table_summary_prompt import TABLE_SUMMARY_PROMPT
from .prompts.text_to_sql_prompt import TEXT_TO_SQL_PROMPT
from .streaming_web_socket_callback_handler import StreamingWebsocketCallbackHandler
from .tools.table_schema import get_table_schema_by_name, get_table_schemas_by_names

LOG = get_logger(__file__)


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    def set_config(self, config: dict):
        self._config = config

    @abstractmethod
    def _get_token_count(self, ai_command: str, prompt: str) -> int:
        """Get the number of tokens in the prompt."""
        raise NotImplementedError()

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

    def _get_default_llm_config(self):
        return self._config.get("default", {}).get("model_args", {})

    def _get_llm_config(self, ai_command: str):
        return {
            **self._get_default_llm_config(),
            **self._config.get(ai_command, {}).get("model_args", {}),
        }

    def _get_usable_token_count(self, ai_command: str) -> int:
        ai_command_config = self._config.get(ai_command, {})
        default_config = self._config.get("default", {})

        max_context_length = ai_command_config.get(
            "context_length"
        ) or default_config.get("context_length", 0)
        reserved_tokens = ai_command_config.get(
            "reserved_tokens"
        ) or default_config.get("reserved_tokens", 0)

        return max_context_length - reserved_tokens

    @abstractmethod
    def _get_llm(
        self, ai_command, callback_handler: StreamingWebsocketCallbackHandler = None
    ):
        """return the large language model to use"""
        raise NotImplementedError()

    def _get_sql_title_prompt(self, query):
        return SQL_TITLE_PROMPT.format(query=query)

    def _get_text_to_sql_prompt(self, dialect, question, table_schemas, original_query):
        return TEXT_TO_SQL_PROMPT.format(
            dialect=dialect,
            question=question,
            table_schemas=table_schemas,
            original_query=original_query,
        )

    def _get_sql_fix_prompt(self, dialect, query, error, table_schemas):
        return SQL_FIX_PROMPT.format(
            dialect=dialect, query=query, error=error, table_schemas=table_schemas
        )

    def _get_table_summary_prompt(self, table_schema, sample_queries):
        token_count = 0
        context_limit = self._get_usable_token_count(AICommandType.TABLE_SUMMARY.value)
        prompt_sample_queries = []
        for query in sample_queries:
            count = self._get_token_count(AICommandType.TABLE_SUMMARY.value, query)
            if token_count + count > context_limit:
                break

            token_count += count
            prompt_sample_queries.append(query)

        return TABLE_SUMMARY_PROMPT.format(
            table_schema=table_schema, sample_queries=prompt_sample_queries
        )

    def _get_sql_summary_prompt(self, table_schemas, query):
        return SQL_SUMMARY_PROMPT.format(table_schemas=table_schemas, query=query)

    def _get_table_select_prompt(self, top_n, question, table_schemas):
        return TABLE_SELECT_PROMPT.format(
            top_n=top_n,
            question=question,
            table_schemas=table_schemas,
        )

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
        query_engine = admin_logic.get_query_engine_by_id(
            query_engine_id, session=session
        )
        if not tables:
            tables = self.find_tables(
                metastore_id=query_engine.metastore_id,
                question=question,
                session=session,
            )
            if tables:
                socket.send_tables_for_sql_gen(tables)

        # not finding any relevant tables
        if not tables:
            # ask user to provide table names
            socket.send_data(
                "Sorry, I can't find any relevant tables by the given context. Please provide table names above."
            )
            socket.close()
            return

        table_schemas = get_table_schemas_by_names(
            metastore_id=query_engine.metastore_id,
            full_table_names=tables,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_text_to_sql_prompt(
            dialect=query_engine.language,
            question=question,
            table_schemas=table_schemas,
            original_query=original_query,
        )
        llm = self._get_llm(
            ai_command=AICommandType.TEXT_TO_SQL.value,
            callback_handler=StreamingWebsocketCallbackHandler(socket),
        )
        return llm.predict(text=prompt)

    @catch_error
    @with_ai_socket(command_type=AICommandType.SQL_TITLE)
    def generate_title_from_query(self, query, socket=None):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        prompt = self._get_sql_title_prompt(query=query)
        llm = self._get_llm(
            ai_command=AICommandType.SQL_TITLE.value,
            callback_handler=StreamingWebsocketCallbackHandler(socket),
        )
        return llm.predict(text=prompt)

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
        table_schemas = get_table_schemas_by_names(
            metastore_id=metastore_id,
            full_table_names=[
                table for statement_tables in table_names for table in statement_tables
            ],
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_sql_fix_prompt(
            dialect=language,
            query=query_execution.query,
            error=self._get_query_execution_error(query_execution),
            table_schemas=table_schemas,
        )
        llm = self._get_llm(
            ai_command=AICommandType.SQL_FIX.value,
            callback_handler=StreamingWebsocketCallbackHandler(socket),
        )
        return llm.predict(text=prompt)

    @catch_error
    @with_session
    def summarize_table(
        self,
        metastore_id: int,
        table_name: str,
        sample_queries: list[str] = None,
        session=None,
    ):
        """Generate an informative summary of the table."""

        table_schema = get_table_schema_by_name(
            metastore_id=metastore_id,
            full_table_name=table_name,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        if not sample_queries:
            sample_query_cells = get_sample_query_cells_by_table_name(
                table_name=table_name, k=MAX_SAMPLE_QUERY_COUNT_FOR_TABLE_SUMMARY
            )
            sample_queries = [cell["query_text"] for cell in sample_query_cells]

        prompt = self._get_table_summary_prompt(
            table_schema=table_schema, sample_queries=sample_queries
        )
        llm = self._get_llm(
            ai_command=AICommandType.TABLE_SUMMARY.value, callback_handler=None
        )
        return llm.predict(text=prompt)

    @catch_error
    @with_session
    def summarize_query(
        self,
        metastore_id: int,
        query: str,
        table_names: list[int],
        session=None,
    ):
        """Generate an informative summary of the query."""

        table_schemas = get_table_schemas_by_names(
            metastore_id=metastore_id,
            full_table_names=table_names,
            should_skip_column=self._should_skip_column,
            session=session,
        )

        prompt = self._get_sql_summary_prompt(table_schemas=table_schemas, query=query)
        llm = self._get_llm(
            ai_command=AICommandType.SQL_SUMMARY.value, callback_handler=None
        )
        return llm.predict(text=prompt)

    @with_session
    def find_tables(self, metastore_id, question, session=None):
        """Search similar tables from vector store first, and then ask LLM to select most suitable tables for the question.

        It will return at most `DEFAUTL_TABLE_SELECT_LIMIT` tables by default.
        """
        try:
            tables = get_vector_store().search_tables(
                metastore_id=metastore_id,
                text=question,
            )

            table_names = [t[0] for t in tables]
            table_docs = {}

            token_count = 0
            context_limit = self._get_usable_token_count(
                AICommandType.TABLE_SELECT.value
            )
            for full_table_name in table_names:
                table_schema, table_name = full_table_name.split(".")
                table = get_table_by_name(
                    schema_name=table_schema,
                    name=table_name,
                    metastore_id=metastore_id,
                    session=session,
                )

                if not table:
                    continue

                summary = get_vector_store().get_table_summary(table.id)
                count = self._get_token_count(AICommandType.TABLE_SELECT.value, summary)
                if token_count + count > context_limit:
                    break

                token_count += count
                table_docs[full_table_name] = summary

            prompt = self._get_table_select_prompt(
                top_n=DEFAUTL_TABLE_SELECT_LIMIT,
                table_schemas=table_docs,
                question=question,
            )
            llm = self._get_llm(
                ai_command=AICommandType.TABLE_SELECT.value, callback_handler=None
            )
            return json.loads(llm.predict(text=prompt))
        except Exception as e:
            LOG.error(e, exc_info=True)
            return []
