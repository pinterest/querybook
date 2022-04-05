from abc import ABCMeta, abstractmethod
import markdown2
from bs4 import BeautifulSoup


class BaseNotifier(metaclass=ABCMeta):
    @property
    @abstractmethod
    def notifier_name(self) -> str:
        """Name of the notifier that will be shown on the frontend"""
        raise NotImplementedError()

    @property
    @abstractmethod
    def notifier_format(self):
        # Can be one of 'markdown' | 'html' | 'plaintext' or any custom format
        raise NotImplementedError()

    @abstractmethod
    def notify(self, user, message: str):
        """
        This function sends the notification message to the given user.

        Arguments:
            user (models.user): user to send notification to
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
        return {
            "name": self.notifier_name,
        }
