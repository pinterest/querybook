from abc import ABC, abstractmethod


from langchain.prompts.chat import (
    ChatPromptTemplate,
    SystemMessagePromptTemplate,
    HumanMessagePromptTemplate,
)


class BaseAIAssistant(ABC):
    @property
    def name(self) -> str:
        raise NotImplementedError()

    def set_config(self, config: dict):
        self._config = config

    @property
    def title_generation_prompt_template(self) -> str:
        system_template = "You are a helpful assistant that can summerize SQL queries."
        system_message_prompt = SystemMessagePromptTemplate.from_template(
            system_template
        )
        human_template = (
            "Generate a concise summary with no more than 8 words for the query below. "
            "Only respond the title without any explanation or leading words.\n"
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
