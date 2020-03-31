import re
from urllib.parse import urlparse

import requests
from pyhive.exc import Error

from const.query_execution import QueryExecutionErrorType
from lib.query_executor.base_executor import QueryExecutorBaseClass
from lib.query_executor.clients.hive import HiveClient
from lib.query_executor.executor_template.templates import hive_executor_template
from lib.query_executor.utils import get_parsed_syntax_error

hive_tracking_url_pattern = re.compile(
    r"Starting Job = (\w+).*Tracking URL = (http[^\s]+)"
)


def get_hive_error_obj(e):
    if hasattr(e, "args") and e.args[0] is not None:
        error_arg = e.args[0]
        if isinstance(error_arg, object):  # If error_arg is class
            return error_arg
    return None


class HiveQueryExecutor(QueryExecutorBaseClass):
    @classmethod
    def _get_client(cls, client_setting):
        return HiveClient(**client_setting)

    @classmethod
    def EXECUTOR_NAME(cls):
        return "hive"

    @classmethod
    def EXECUTOR_LANGUAGE(cls):
        return "hive"

    @classmethod
    def EXECUTOR_TEMPLATE(cls):
        return hive_executor_template

    def __init__(self, *args, **kwargs):
        super(HiveQueryExecutor, self).__init__(*args, **kwargs)
        self._mr_jobs = []

    def _get_logs(self):
        logs = super(HiveQueryExecutor, self)._get_logs()
        match = re.search(hive_tracking_url_pattern, logs)
        if match:
            self._mr_jobs.append((match.group(1), match.group(2)))  # Job id  # Job url
        return logs

    def _parse_exception(self, e):
        error_type = QueryExecutionErrorType.INTERNAL.value
        error_str = str(e)
        error_extracted = None
        try:
            if isinstance(e, Error):
                error_type = QueryExecutionErrorType.ENGINE.value
                error_obj = get_hive_error_obj(e)
                if error_obj:
                    if error_obj.__class__.__name__ == "TExecuteStatementResp":
                        error_extracted = error_obj.status.errorMessage
                        error_code = error_obj.status.errorCode
                        sql_state = error_obj.status.sqlState
                        # According to
                        # https://github.com/apache/hive/blob/master/ql/src/java/org/apache/hadoop/hive/ql/ErrorMsg.java
                        # Error code between 10000 to 19999 are compiler erros
                        is_compiler_error = (10000 <= error_code <= 19999) or (
                            error_code == 40000 and sql_state == "42000"
                        )
                        if is_compiler_error:
                            match = re.search(r"(?i)Line (\d+):(\d+)", error_extracted)
                            if match:
                                return get_parsed_syntax_error(
                                    error_extracted,
                                    int(match.group(1)) - 1,
                                    # hive's char position is 0 based, strange
                                    int(match.group(2)),
                                )
                    elif error_obj.__class__.__name__ == "TFetchResultsResp":
                        error_extracted = error_obj.status.errorMessage
            elif error_str.startswith(
                "Error while processing statement: FAILED: Execution Error, return code "
            ):
                error_type = QueryExecutionErrorType.ENGINE.value

                query_diagnostics = []
                for job_id, job_url in self._mr_jobs:
                    query_diagnostics += diagnose_query(job_url, job_id)
                if len(query_diagnostics):
                    error_str = (
                        "Query failed. "
                        + "Found the following error from Logs (Check Mapreduce url for details):\n"
                        + "\n----\n".join(query_diagnostics)
                    )
        except Exception:
            pass
        return error_type, error_str, error_extracted

    @property
    def meta_info(self):
        info = ""
        if self._cursor.tracking_url:
            info += f"Tracking Url: {self._cursor.tracking_url}\n"
        if len(self._mr_jobs) > 0:
            for job_id, job_url in self._mr_jobs:
                info += f"MR {job_id} URL: {job_url}\n"
        return info


def diagnose_query(tracking_url, job_id):
    diagnostics = []
    if tracking_url is None or job_id is None:
        return diagnostics
    try:
        # this line is to account for url redirection
        tracking_url = requests.get(tracking_url).url
        tracking_uri = urlparse(tracking_url)

        rm_host = f"{tracking_uri.scheme}://{tracking_uri.netloc}"
        job_url = f"{rm_host}/ws/v1/history/mapreduce/jobs/{job_id}"
        job_info = make_rm_request(job_url)
        job_diagnostics = job_info["job"]["diagnostics"]

        task_failed_match = re.search(
            r"Task failed (task[_0-9a-zA-Z]+)", job_diagnostics
        )
        if task_failed_match:  # Query Failed due to task failed
            task_id = task_failed_match.group(1)
            task_attempt_url = f"{rm_host}/ws/v1/history/mapreduce/jobs/{job_id}/tasks/{task_id}/attempts"
            task_attempt_info = make_rm_request(task_attempt_url)

            # The first task attempt is the latest attempt
            task_diagnostics = task_attempt_info["taskAttempts"]["taskAttempt"][0][
                "diagnostics"
            ]
            diagnostics.append(task_diagnostics)

        # Check if too many mappers
        num_mappers = job_info["job"]["mapsTotal"]
        if num_mappers > 15000:
            diagnostics.append("Too many mappers")
    finally:
        return diagnostics


def make_rm_request(url):
    return requests.get(url, headers={"Accept": "application/json"}).json()
