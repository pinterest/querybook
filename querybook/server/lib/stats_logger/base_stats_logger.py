from abc import ABC, abstractmethod


class BaseStatsLogger(ABC):
    """Base class for logging realtime stats"""

    def key(self, key: str) -> str:
        if self.prefix:
            return self.prefix + key
        return key

    @property
    def logger_name(self) -> str:
        raise NotImplementedError()

    @property
    def prefix(self) -> str:
        return "querybook."

    @abstractmethod
    def incr(self, key: str, tags: dict[str, str] = None) -> None:
        """Increment a counter"""
        raise NotImplementedError()

    @abstractmethod
    def decr(self, key: str, tags: dict[str, str] = None) -> None:
        """Decrement a counter"""
        raise NotImplementedError()

    @abstractmethod
    def timing(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        raise NotImplementedError()

    @abstractmethod
    def gauge(self, key: str, value: float, tags: dict[str, str] = None) -> None:
        """Setup a gauge"""
        raise NotImplementedError()
