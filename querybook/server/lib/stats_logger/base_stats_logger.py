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
    def incr(self, key: str) -> None:
        """Increment a counter"""
        raise NotImplementedError()

    @abstractmethod
    def decr(self, key: str) -> None:
        """Decrement a counter"""
        raise NotImplementedError()

    @abstractmethod
    def timing(self, key: str, value: float) -> None:
        raise NotImplementedError()

    @abstractmethod
    def gauge(self, key: str, value: float) -> None:
        """Setup a gauge"""
        raise NotImplementedError()
