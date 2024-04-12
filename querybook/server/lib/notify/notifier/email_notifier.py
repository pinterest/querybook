import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from env import QuerybookSettings
from lib.notify.base_notifier import BaseNotifier
from lib.logger import get_logger

LOG = get_logger(__file__)


class EmailNotifier(BaseNotifier):
    @property
    def notifier_name(self):
        return "email"

    @property
    def notifier_help(self) -> str:
        return "Recipient could be a Querybook user or a valid Email address"

    @property
    def notifier_format(self):
        return "html"

    def notify_recipients(self, recipients, message):
        from_email = QuerybookSettings.QUERYBOOK_EMAIL_ADDRESS
        subject = message.split("\n")[0]
        message = self._convert_markdown(message)
        try:
            date = datetime.now().strftime("%a, %d %b %Y")

            msg = MIMEMultipart()
            msg["Subject"] = subject
            msg["Date"] = date
            msg["From"] = from_email
            msg["To"] = ", ".join(recipients)
            msg.attach(MIMEText(message, "html"))

            smtp = smtplib.SMTP(QuerybookSettings.EMAILER_CONN)
            smtp.sendmail(msg["From"], recipients, msg.as_string())
        except Exception as e:
            LOG.info(e)

    def notify(self, user, message):
        self.notify_recipients(recipients=[user.email], message=message)
