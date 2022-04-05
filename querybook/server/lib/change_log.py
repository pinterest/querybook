import os
from itertools import islice
from const.path import CHANGE_LOG_PATH


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
        __change_logs = []
        change_log_files = sorted(os.listdir(CHANGE_LOG_PATH), reverse=True)
        for filename in change_log_files:
            if filename.startswith("breaking_change"):
                # Breaking change is not included for change logs UI
                # These are used for developer references when upgrading
                continue

            with open(os.path.join(CHANGE_LOG_PATH, "./{}".format(filename))) as f:
                changelog_date = filename.split(".")[0]
                __change_logs.append(
                    {
                        "date": changelog_date,
                        "content": generate_change_log(f.read()),
                    }
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
