import jinja2
from lib.notify.all_notifiers import get_notifier_class, DEFAULT_NOTIFIER
from logic import user as user_logic
from app.db import with_session


@with_session
def get_user_preferred_notifier(user_id, session=None):
    notification_preference = user_logic.get_user_settings(
        user_id, "notification_preference", session=session
    )
    return (
        notification_preference.value
        if notification_preference is not None
        else DEFAULT_NOTIFIER
    )


def notify_recipients(recipients, template_name, template_params, notifier_name):
    notifier = get_notifier_class(notifier_name)
    markdown_message = render_message(template_name, template_params)
    notifier.notify_recipients(recipients=recipients, message=markdown_message)


@with_session
def notify_user(user, template_name, template_params, notifier_name=None, session=None):
    if notifier_name is None:
        notifier_name = get_user_preferred_notifier(user.id, session=session)
        if notifier_name is None:
            return
    notifier = get_notifier_class(notifier_name)
    markdown_message = render_message(template_name, template_params)
    notifier.notify(user=user, message=markdown_message)


def render_message(template_name, context):
    jinja_env = jinja2.Environment(
        loader=jinja2.FileSystemLoader("./querybook/notification_templates/")
    )
    template = jinja_env.get_template(f"{template_name}.md")
    return template.render(context)
