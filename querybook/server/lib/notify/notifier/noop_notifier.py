from lib.notify.base_notifier import BaseNotifier
from lib.logger import get_logger

LOG = get_logger(__file__)


class NoopNotifier(BaseNotifier):
    @property
    def notifier_name(self):
        return "noop"

    @property
    def notifier_help(self) -> str:
        return "Noop notifier does not send any notification. It is used for testing purposes."

    @property
    def notifier_format(self):
        return "plaintext"

    def notify_recipients(self, recipients, message):
        LOG.info(f"📣 Noop notification to {recipients}: {message}")
        LOG.info(
            "📣 No notifier is configured, please configure a notifier to receive actual notifications!"
        )

    def notify(self, user, message):
        self.notify_recipients(recipients=[user.email], message=message)
