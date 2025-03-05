import os
from itertools import islice

from const.path import CHANGE_LOG_PATH
from env import QuerybookSettings

__change_logs = None


def generate_change_log(raw_text: str) -> str:
    # TODO: either move the changelog completely to documentation site
    #       or come up with a solution that can be compatible with both
    return raw_text.replace("![](/changelog/", "![](/static/changelog/")


def load_all_change_logs():
    # Eventually there will be too many changelogs
    # TODO: add a maximum number of change logs to load
    global __change_logs
    if not __change_logs:
        change_logs = {}
        change_log_files = sorted(os.listdir(CHANGE_LOG_PATH), reverse=True)

        change_log_plugin_path = os.path.join(
            QuerybookSettings.QUERYBOOK_PLUGIN_PATH, "./change_log_plugin/changelog/"
        )

        plugin_change_log_files = sorted(
            os.listdir(change_log_plugin_path), reverse=True
        )
        # Process main change log files
        for filename in change_log_files:
            if filename.startswith("breaking_change") or filename.startswith(
                "security_advisories"
            ):
                # Breaking changes and security advisories is not included for change logs UI
                # These are used for developer references when upgrading
                continue

            with open(os.path.join(CHANGE_LOG_PATH, filename)) as f:
                changelog_date = filename.split(".")[0]
                change_logs[changelog_date] = {
                    "date": changelog_date,
                    "content": generate_change_log(f.read()),
                }

        # Process plugin change log files (override if date already exists)
        for filename in plugin_change_log_files:
            with open(os.path.join(change_log_plugin_path, filename)) as f:
                changelog_date = filename.split(".")[0]
                change_logs[changelog_date] = {
                    "date": changelog_date,
                    "content": generate_change_log(f.read()),
                }

        # Convert dictionary to list sorted by date in descending order
        __change_logs = sorted(
            change_logs.values(), key=lambda x: x["date"], reverse=True
        )
    return __change_logs


def get_change_log_list(limit=None, date_after=None):
    change_logs = load_all_change_logs()

    change_logs_list = []
    for change_log in islice(change_logs, 0, limit):
        if date_after is not None and change_log["date"] <= date_after:
            break
        change_logs_list.append(change_log)
    return change_logs_list


def get_change_log_content_by_date(date):
    change_logs = load_all_change_logs()

    for change_log in change_logs:
        if change_log["date"] == date:
            return change_log["content"]
