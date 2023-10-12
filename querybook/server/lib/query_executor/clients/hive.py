import json
import re

from pyhive import hive
from TCLIService.ttypes import TOperationState
from lib.utils.utils import Timeout
from lib.query_executor.base_client import ClientBaseClass, CursorBaseClass
from lib.query_executor.connection_string.hive import get_hive_connection_conf

hive_tracking_url_pattern = re.compile(r"View progress at (.*)")


class HiveClient(ClientBaseClass):
    def __init__(
        self,
        connection_string=None,
        username=None,
        password=None,
        proxy_user=None,
        impersonate=False,
        *args,
        **kwargs
    ):
        with Timeout(120, "Timeout connecting to HiveServer"):
            connection_conf = get_hive_connection_conf(connection_string)

            port = 10000 if not connection_conf.port else connection_conf.port
            configuration = dict(connection_conf.configuration)
            configuration["mapred.job.queue.name"] = "root.dev-test"
            if proxy_user and impersonate:
                configuration["hive.server2.proxy.user"] = proxy_user
                configuration["mapred.job.queue.name"] = "root.users.%s" % proxy_user
            self._connection = hive.connect(
                host=connection_conf.host,
                port=port,
                database=connection_conf.default_db,
                auth="LDAP",
                username=username,
                password=password,
                configuration=configuration,
            )
        super(HiveClient, self).__init__()

    def cursor(self) -> CursorBaseClass:
        return HiveCursor(cursor=self._connection.cursor())


class HiveCursor(CursorBaseClass):
    def __init__(self, cursor):
        self._cursor = cursor
        self._init_query_state_vars()

    def _init_query_state_vars(self):
        self._percent_complete = 0
        self._tracking_url = None

    def run(self, query, run_async=True):
        # Clear query state vars every time we run
        # a new query
        self._init_query_state_vars()
        self._cursor.execute(query, async_=run_async)

    def cancel(self):
        self._cursor.cancel()

    def poll(self):
        poll_result = self._cursor.poll()
        status = poll_result.operationState
        # Finished if status is not running or initializing
        completed = status in (
            TOperationState.FINISHED_STATE,
            TOperationState.CANCELED_STATE,
            TOperationState.CLOSED_STATE,
            TOperationState.ERROR_STATE,
        )

        if status == TOperationState.ERROR_STATE:
            raise Exception(poll_result.errorMessage)

        if status == TOperationState.CANCELED_STATE:
            raise Exception("User Canceled")

        self._update_percent_complete(poll_result)

        return completed

    def get_one_row(self):
        return self._cursor.fetchone()

    def get_n_rows(self, n: int):
        return self._cursor.fetchmany(size=n)

    def get_columns(self):
        description = self._cursor.description
        if description is None:
            # Not a select query, no return
            return None
        else:
            columns = list(map(lambda d: d[0], description))
            return columns

    def get_logs(self):
        log = self._cursor.fetch_logs()
        log_str = "\n".join(log)

        self._update_tracking_url(log_str)

        return log_str

    @property
    def percent_complete(self):
        return self._percent_complete

    @property
    def tracking_url(self):
        return self._tracking_url

    def _update_percent_complete(self, poll_result):
        # Hive 2.3+ includes progressUpdateResponse to provide % completion
        if getattr(poll_result, "progressUpdateResponse", None):
            update_resp = poll_result.progressUpdateResponse
            percent_complete = (
                update_resp.progressedPercentage
                if hasattr(update_resp, "progressedPercentage")
                else 0
            )
            self._percent_complete = round(percent_complete, 2) * 100
        else:
            # this is the fallback (in case no progressUpdateResponse is included)
            # Hive <= 1.2.1. Fallback is to check map/reduce completed tasks
            task_status = poll_result.taskStatus
            if task_status:
                try:
                    parsed_task_status = json.loads(task_status)
                    map_reduce_stages = [
                        stage
                        for stage in parsed_task_status
                        if stage.get("taskType", "") == "MAPRED"
                    ]
                    if len(map_reduce_stages) > 0:
                        stage_sum = sum(
                            map(
                                lambda stage: stage.get("mapProgress", 0)
                                + stage.get("reduceProgress", 0),
                                map_reduce_stages,
                            )
                        )
                        # Because each stage sum is a total of 200
                        self._percent_complete = stage_sum / (
                            len(map_reduce_stages) * 2
                        )
                except Exception as e:
                    e  # to get rid of lint error

    def _update_tracking_url(self, log: str):
        if self._tracking_url:
            # No need to find new tracking url
            # since we already have it
            return

        match = hive_tracking_url_pattern.search(log)
        if match:
            self._tracking_url = match.group(1)
