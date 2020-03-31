import os
from itertools import islice
import markdown2
from const.path import CHANGE_LOG_PATH


__change_logs = None


def load_all_change_logs():
    # Eventually there will be too many changelogs
    # TODO: add a maximum number of change logs to load
    global __change_logs
    if not __change_logs:
        __change_logs = []
        change_log_files = sorted(os.listdir(CHANGE_LOG_PATH), reverse=True)
        for filename in change_log_files:
            with open(os.path.join(CHANGE_LOG_PATH, "./{}".format(filename))) as f:
                __change_logs.append(
                    {
                        "date": filename.split(".")[0],
                        "content": markdown2.markdown(f.read()),
                    }
                )
    return __change_logs


def get_change_logs(limit=5, date_after=None):
    change_logs = load_all_change_logs()

    change_log_content = ""
    for change_log in islice(change_logs, 0, limit):
        if date_after is not None and change_log["date"] < date_after:
            break
        change_log_content += change_log["content"] + "<br />"
    return change_log_content
