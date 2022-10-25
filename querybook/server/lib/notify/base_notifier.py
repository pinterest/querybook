from abc import ABCMeta, abstractmethod
import markdown2
from bs4 import BeautifulSoup

from models.user import User


class BaseNotifier(metaclass=ABCMeta):
    @property
    @abstractmethod
    def notifier_name(self) -> str:
        """Name of the notifier that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def notifier_help(self) -> str:
        """Help text of the notifier recipients"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def notifier_format(self):
        # Can be one of 'markdown' | 'html' | 'plaintext' or any custom format
        raise NotImplementedError()

    @abstractmethod
    def notify_recipients(self, recipients: list[str], message: str):
        """
        This function sends the notification message to the given recipients.

        Arguments:
            recipient (str): recipients to send notification to, which could be like slack
                user/channel names or email addresses according to the actual notifer
            message (str): message content in markdown format
        """
        raise NotImplementedError()

    @abstractmethod
    def notify(self, user: User, message: str):
        """
        This function sends the notification message to the given user.

        Arguments:
            user (models.user): Querybook user to send notification to
            message (str): message content in markdown format
        """
        raise NotImplementedError()

    def _convert_markdown(self, message: str) -> str:
        """
        Converts message from markdown to notifier_format

        Arguments:
            message (str): notification string in markdown format

        Returns: message that has been converted to self.notifier_format
        """
        if self.notifier_format == "html":
            return markdown2.markdown(message)
        elif self.notifier_format == "plaintext":
            html = markdown2.markdown(message)
            soup = BeautifulSoup(html, "html.parser")
            text = soup.text
            return text
        else:
            return message

    def to_dict(self):
        return {"name": self.notifier_name, "help": self.notifier_help}
