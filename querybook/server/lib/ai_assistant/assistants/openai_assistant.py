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
    def title_generation_prompt_template(self) -> str:
        system_message_prompt = SystemMessage(
            content="You are a helpful assistant that can summerize SQL queries."
        )
        human_template = (
            "Generate a concise summary with no more than 8 words for the query below. "
            "Only respond the title without any explanation or final period.\n"
            "```\n{query}\n```\nTitle:"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    @property
    def query_auto_fix_prompt_template(self) -> str:
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
            "===Table schemas\n"
            "{table_schemas}\n\n"
            "===Response format\n"
            "<@key-1@>\n"
            "value-1\n\n"
            "<@key-2@>\n"
            "value-2\n\n"
            "===Response restrictions\n"
            "1. Only include SQL queries in the fixed_query section, no additional comments or information.\n"
            "2. If there isn't enough information or context to address the query error, you may leave the fixed_query section blank or provide a general suggestion instead.\n"
            "3. Retain the original query format and case in the fixed_query section, except when correcting the erroneous part.\n"
            "===Example response:\n"
            "<@explanation@>\n"
            "This is an explanation about the error\n\n"
            "<@fix_suggestion@>\n"
            "This is a recommended fix for the error\n\n"
            "<@fixed_query@>\n"
            "The fixed SQL query\n\n"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    @property
    def generate_sql_query_prompt_template(self) -> str:
        system_message_prompt = SystemMessage(
            content=(
                "You are a SQL expert that can help generating SQL query.\n\n"
                "Please follow the format below for your response:\n"
                "<@key-1@>\n"
                "value-1\n\n"
                "<@key-2@>\n"
                "value-2\n\n"
            )
        )
        human_template = (
            "Please help to generate a new SQL query or edit the original query for below question based ONLY on the given context. \n\n"
            "===SQL Dialect\n"
            "{dialect}\n\n"
            "===Tables\n"
            "{table_schemas}\n\n"
            "===Original Query\n"
            "{original_query}\n\n"
            "===Question\n"
            "{question}\n\n"
            "===Response format\n"
            "<@key-1@>\n"
            "value-1\n\n"
            "<@key-2@>\n"
            "value-2\n\n"
            "===Response Restrictions\n"
            "1. If there is enough information and context to generate/edit the query, please respond only with the new query without any explanation.\n"
            "2. If there isn't enough information or context to generate/edit the query, provide an explanation for the missing context.\n"
            "===Example Response:\n"
            "Example 1: Insufficient Context\n"
            "<@explanation@>\n"
            "An explanation of the missing context is provided here.\n\n"
            "Example 2: Query Generation Possible\n"
            "<@query@>\n"
            "Generated SQL query based on provided context is provided here.\n\n"
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
