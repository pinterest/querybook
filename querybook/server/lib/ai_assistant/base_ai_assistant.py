import functools
from abc import ABC, abstractmethod

from flask_login import current_user
from langchain.chains import LLMChain
from langchain.memory import ConversationBufferMemory
from pydantic.error_wrappers import ValidationError

from app.db import with_session
from app.flask_app import socketio
from const.ai_assistant import AICommandType
from clients.redis_client import with_redis
from lib.logger import get_logger
from lib.query_analysis.lineage import process_query
from logic import admin as admin_logic
from logic import datadoc as datadoc_logic
from logic import metastore as m_logic
from logic import query_execution as qe_logic
from models.metastore import DataTableColumn
from models.query_execution import QueryExecution

from .prompts.sql_fix_prompt import PROMPT as SQL_FIX_PROMPT
from .prompts.sql_title_prompt import PROMPT as SQL_TITLE_PROMPT
from .prompts.text2sql_prompt import PROMPT as TEXT2SQL_PROMPT
from .redis_chat_history_storage import RedisChatHistoryStorage
from .web_socket_callback_handler import WebSocketStream, WebSocketCallbackHandler

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
    def _get_llm(self, callback_handler: WebSocketCallbackHandler):
        """return the language model to use"""

    @with_redis
    def _get_chat_memory(
        self,
        session_id,
        memory_key="chat_history",
        input_key="question",
        ttl=600,
        redis_conn=None,
    ):
        message_history_storage = RedisChatHistoryStorage(
            redis_client=redis_conn, ttl=ttl, session_id=session_id
        )

        return ConversationBufferMemory(
            memory_key=memory_key,
            chat_memory=message_history_storage,
            input_key=input_key,
            return_messages=True,
        )

    def _get_sql_title_prompt(self):
        """Override this method to return specific prompt for your own assistant."""
        return SQL_TITLE_PROMPT

    def _get_text2sql_prompt(self):
        """Override this method to return specific prompt for your own assistant."""
        return TEXT2SQL_PROMPT

    def _get_sql_fix_prompt(self):
        """Override this method to return specific prompt for your own assistant."""
        return SQL_FIX_PROMPT

    def _get_llm_chain(self, command_type, prompt, memory=None):
        ws_stream = WebSocketStream(socketio, command_type)
        callback_handler = WebSocketCallbackHandler(ws_stream)
        llm = self._get_llm(callback_handler=callback_handler)
        return LLMChain(llm=llm, prompt=prompt, memory=memory)

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

    def handle_ai_command(self, command_type: str, payload: dict = {}):
        data_cell_id = payload.get("data_cell_id")
        data_cell = datadoc_logic.get_data_cell_by_id(data_cell_id)
        query = data_cell.context if data_cell else None

        if command_type == AICommandType.SQL_TITLE.value:
            self.generate_title_from_query(query=query)
        elif command_type == AICommandType.TEXT_TO_SQL.value:
            query_engine_id = payload.get("query_engine_id")
            tables = payload.get("tables")
            question = payload.get("question")
            self.generate_sql_query(
                query_engine_id=query_engine_id,
                tables=tables,
                question=question,
                original_query=query,
                memory_session_id=f"{current_user.id}_{data_cell_id}",
            )
        elif command_type == AICommandType.SQL_FIX.value:
            query_execution_id = payload.get("query_execution_id")
            self.query_auto_fix(
                query_execution_id=query_execution_id,
            )

    @catch_error
    @with_session
    def generate_sql_query(
        self,
        query_engine_id: int,
        tables: list[str],
        question: str,
        original_query: str = None,
        memory_session_id=None,
        session=None,
    ):
        query_engine = admin_logic.get_query_engine_by_id(
            query_engine_id, session=session
        )
        table_schemas = self._generate_table_schema_prompt(
            metastore_id=query_engine.metastore_id, table_names=tables, session=session
        )

        prompt = self._get_text2sql_prompt()
        memory = self._get_chat_memory(session_id=memory_session_id)
        chain = self._get_llm_chain(
            command_type=AICommandType.TEXT_TO_SQL.value,
            prompt=prompt,
            memory=memory,
        )
        return chain.run(
            dialect=query_engine.language,
            question=question,
            table_schemas=table_schemas,
            original_query=original_query,
        )

    @catch_error
    def generate_title_from_query(
        self,
        query,
    ):
        """Generate title from SQL query.

        Args:
            query (str): SQL query
            stream (bool, optional): Whether to stream the result. Defaults to True.
            callback_handler (CallbackHandler, optional): Callback handler to handle the straming result. Required if stream is True.
        """
        prompt = self._get_sql_title_prompt()
        chain = self._get_llm_chain(
            command_type=AICommandType.SQL_TITLE.value,
            prompt=prompt,
        )
        return chain.run(query=query)

    @catch_error
    @with_session
    def query_auto_fix(
        self,
        query_execution_id: int,
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
        table_schemas = self._generate_table_schema_prompt(
            metastore_id=metastore_id,
            table_names=[
                table for statement_tables in table_names for table in statement_tables
            ],
            session=session,
        )

        prompt = self._get_sql_fix_prompt()
        chain = self._get_llm_chain(
            command_type=AICommandType.SQL_FIX.value,
            prompt=prompt,
        )
        return chain.run(
            dialect=language,
            query=query_execution.query,
            error=self._get_query_execution_error(query_execution),
            table_schemas=table_schemas,
        )
