from lib.ai_assistant.base_ai_assistant import BaseAIAssistant
from lib.logger import get_logger

from langchain.chat_models import ChatOpenAI
from langchain.callbacks.manager import CallbackManager
from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessage,
    HumanMessagePromptTemplate,
)
import openai


LOG = get_logger(__file__)


class OpenAIAssistant(BaseAIAssistant):
    """To use it, please set the following environment variable:
    OPENAI_API_KEY: OpenAI API key
    """

    @property
    def name(self) -> str:
        return "openai"

    def _get_error_msg(self, error) -> str:
        if isinstance(error, openai.error.AuthenticationError):
            return "Invalid OpenAI API key"

        return super()._get_error_msg(error)

    @property
    def title_generation_prompt_template(self) -> ChatPromptTemplate:
        system_message_prompt = SystemMessage(
            content="You are a helpful assistant that can summerize SQL queries."
        )
        human_template = (
            "Generate a brief 10-word-maximum title for the SQL query below. "
            "===Query\n"
            "{query}\n\n"
            "===Response Guidelines\n"
            "1. Only respond with the title without any explanation\n"
            "2. Dont use double quotes to enclose the title\n"
            "3. Dont add a final period to the title\n\n"
            "===Example response\n"
            "This is a title\n"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    @property
    def query_auto_fix_prompt_template(self) -> ChatPromptTemplate:
        system_message_prompt = SystemMessage(
            content=(
                "You are a SQL expert that can help fix SQL query errors.\n\n"
                "Please follow the format below for your response:\n"
                "<@key-1@>\n"
                "value-1\n\n"
                "<@key-2@>\n"
                "value-2\n\n"
            )
        )
        human_template = (
            "Please help fix the query below based on the given error message and table schemas. \n\n"
            "===SQL dialect\n"
            "{dialect}\n\n"
            "===Query\n"
            "{query}\n\n"
            "===Error\n"
            "{error}\n\n"
            "===Table Schemas\n"
            "{table_schemas}\n\n"
            "===Response Format\n"
            "<@key-1@>\n"
            "value-1\n\n"
            "<@key-2@>\n"
            "value-2\n\n"
            "===Example response:\n"
            "<@explanation@>\n"
            "This is an explanation about the error\n\n"
            "<@fix_suggestion@>\n"
            "This is a recommended fix for the error\n\n"
            "<@fixed_query@>\n"
            "The fixed SQL query\n\n"
            "===Response Guidelines\n"
            "1. For the <@fixed_query@> section, it can only be a valid SQL query without any explanation.\n"
            "2. If there is insufficient context to address the query error, you may leave the fixed_query section blank and provide a general suggestion instead.\n"
            "3. Maintain the original query format and case in the fixed_query section, including comments, except when correcting the erroneous part.\n"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    @property
    def generate_sql_query_prompt_template(self) -> ChatPromptTemplate:
        system_message_prompt = SystemMessage(
            content=(
                "You are a SQL expert that can help generating SQL query.\n\n"
                "Please follow the key/value pair format below for your response:\n"
                "<@key-1@>\n"
                "value-1\n\n"
                "<@key-2@>\n"
                "value-2\n\n"
            )
        )
        human_template = (
            "Please help to generate a new SQL query or modify the original query to answer the following question. Your response should ONLY be based on the given context.\n\n"
            "===SQL Dialect\n"
            "{dialect}\n\n"
            "===Tables\n"
            "{table_schemas}\n\n"
            "===Original Query\n"
            "{original_query}\n\n"
            "===Question\n"
            "{question}\n\n"
            "===Response Format\n"
            "<@key-1@>\n"
            "value-1\n\n"
            "<@key-2@>\n"
            "value-2\n\n"
            "===Example Response:\n"
            "Example 1: Sufficient Context\n"
            "<@query@>\n"
            "A generated SQL query based on the provided context with the asked question at the beginning is provided here.\n\n"
            "Example 2: Insufficient Context\n"
            "<@explanation@>\n"
            "An explanation of the missing context is provided here.\n\n"
            "===Response Guidelines\n"
            "1. If the provided context is sufficient, please respond only with a valid SQL query without any explanations in the <@query@> section. The query should start with a comment containing the question being asked.\n"
            "2. If the provided context is insufficient, please explain what information is missing.\n"
            "3. If the original query is provided, please modify the original query to answer the question. The original query may start with a comment containing a previously asked question. If you find such a comment, please use both the original question and the new question to generate the new query.\n"
            "4. The <@key_name@> in the response can only be <@explanation@> or <@query@>.\n\n"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    def _generate_title_from_query(
        self, query, stream=True, callback_handler=None, user_id=None
    ):
        """Generate title from SQL query using OpenAI's chat model."""
        messages = self.title_generation_prompt_template.format_prompt(
            query=query
        ).to_messages()
        chat = ChatOpenAI(
            **self._config,
            streaming=stream,
            callback_manager=CallbackManager([callback_handler]),
        )
        ai_message = chat(messages)
        return ai_message.content

    def _query_auto_fix(
        self,
        language,
        query,
        error,
        table_schemas,
        stream,
        callback_handler,
        user_id=None,
    ):
        """Query auto fix using OpenAI's chat model."""
        messages = self.query_auto_fix_prompt_template.format_prompt(
            dialect=language, query=query, error=error, table_schemas=table_schemas
        ).to_messages()
        chat = ChatOpenAI(
            **self._config,
            streaming=stream,
            callback_manager=CallbackManager([callback_handler]),
        )
        ai_message = chat(messages)
        return ai_message.content

    def _generate_sql_query(
        self,
        language: str,
        table_schemas: str,
        question: str,
        original_query: str,
        stream,
        callback_handler,
        user_id=None,
    ):
        """Generate SQL query using OpenAI's chat model."""
        messages = self.generate_sql_query_prompt_template.format_prompt(
            dialect=language,
            question=question,
            table_schemas=table_schemas,
            original_query=original_query,
        ).to_messages()
        chat = ChatOpenAI(
            **self._config,
            streaming=stream,
            callback_manager=CallbackManager([callback_handler]),
        )
        ai_message = chat(messages)
        return ai_message.content
