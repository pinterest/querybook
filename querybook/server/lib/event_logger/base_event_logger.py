from abc import ABC, abstractmethod

from const.event_log import EventType


class BaseEventLogger(ABC):
    """Base interface for event logger"""

    @property
    @abstractmethod
    def logger_name(self) -> str:
        """Name of the event logger that will be shown on the frontend"""
        raise NotImplementedError()

    @abstractmethod
    def log(self, uid: int, event_type: EventType, event_data: dict) -> None:
        """Log an event to some data store

        Args:
            uid (int): id of the user who performed the action
            event_type (EventType): action event type, e.g. CLICK, VIEW
            event_data (dict): addtional info of the event in JSON format.
        """
        raise NotImplementedError()
