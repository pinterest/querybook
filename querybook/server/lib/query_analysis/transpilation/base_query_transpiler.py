from abc import ABC, abstractmethod
from typing import List, Optional, Tuple, TypedDict


class TranspiledQuery(TypedDict):
    transpiled_query: str

    # The original query that's getting transformed
    # Provide this value if the transpiled query is
    # getting formatted for better user comparison experience
    original_query: Optional[str]


class BaseQueryTranspiler(ABC):
    @abstractmethod
    def name(self) -> str:
        raise NotImplementedError()

    @abstractmethod
    def from_languages(self) -> List[str]:
        raise NotImplementedError()

    @abstractmethod
    def to_languages(self) -> List[str]:
        raise NotImplementedError()

    @abstractmethod
    def transpile(
        self, query: str, from_language: str, to_language: str
    ) -> Tuple[str, str]:
        raise NotImplementedError()

    def to_dict(self):
        return {
            "from_languages": self.from_languages(),
            "to_languages": self.to_languages(),
            "name": self.name(),
        }
