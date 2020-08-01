import jinja2
from lib.notify.all_notifiers import get_notifier_class


def notify_user(user, notifier_name, template_name, template_params):
    notifier = get_notifier_class(notifier_name)
    markdown_message = render_message(template_name, template_params)
    notifier.notify(user=user, message=markdown_message)


def capitalize_username(username: str):
    return " ".join([name.capitalize() for name in username.split(" ")])


def render_message(template_name, context):
    jinja_env = jinja2.Environment(
        loader=jinja2.FileSystemLoader("./datahub/notification_templates/")
    )
    template = jinja_env.get_template(f"{template_name}.md")
    return template.render(context)
