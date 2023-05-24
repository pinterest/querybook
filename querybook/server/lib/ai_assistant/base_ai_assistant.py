from abc import ABC, abstractmethod


from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    AIMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    @property
    def title_generation_prompt_template(self) -> str:
        system_template = "You are a helpful assistant that can summerize SQL queries."
        system_message_prompt = SystemMessagePromptTemplate.from_template(
            system_template
        )
        human_template = (
            "Try to explain what below SQL query does and then generate a concise title for it. "
            "Please only respond the title without any explanation.\n"
            "```\n{query}\n```\nTitle:"
        )
        human_message_prompt = HumanMessagePromptTemplate.from_template(human_template)
        return ChatPromptTemplate.from_messages(
            [system_message_prompt, human_message_prompt]
        )

    @abstractmethod
    def generate_sql_query(
        self, metastore_id: int, query_engine_id: int, question: str, tables: list[str]
    ):
        raise NotImplementedError()

    @abstractmethod
    def generate_title_from_query(self, query, stream=True):
        raise NotImplementedError()
