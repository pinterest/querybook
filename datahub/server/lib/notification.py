from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
import requests
import jinja2

from lib.logger import get_logger
from env import DataHubSettings

LOG = get_logger(__file__)


def send_slack_message(to, message, token=DataHubSettings.DATAHUB_SLACK_TOKEN):
    """Send Message to slack user/channel

        Keyword arguments:
        token: the api token
        to: the user or channel message is going to
        message: the actual message in raw text
    """

    url = "https://slack.com/api/chat.postMessage"

    headers = {"Authorization": "Bearer {}".format(token)}

    data = {
        "text": message,
        "channel": to,
    }

    return requests.post(url, json=data, headers=headers, timeout=30)


def simple_email(
    subject, html, to_email, from_email=DataHubSettings.DATAHUB_EMAIL_ADDRESS
):
    try:
        date = datetime.now().strftime("%a, %d %b %Y")

        msg = MIMEMultipart()
        msg["Subject"] = subject
        msg["Date"] = date
        msg["From"] = from_email
        msg["To"] = to_email
        msg.attach(MIMEText(html, "html"))

        smtp = smtplib.SMTP(DataHubSettings.EMAILER_CONN)
        smtp.sendmail(msg["From"], msg["To"], msg.as_string())
    except Exception as e:
        LOG.info(e)


def render_html(template_name, context):
    jinja_env = jinja2.Environment(
        loader=jinja2.FileSystemLoader("./datahub/email_templates/")
    )
    template = jinja_env.get_template(template_name)
    return template.render(context)
