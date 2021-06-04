from unittest import TestCase
from lib.query_executor.clients.hive import HiveCursor
from TCLIService.ttypes import *
import json


class ProgressPercentageTestCase(TestCase):
    def test_progress_percentage_reported(self):
        progress_resp = TProgressUpdateResp(progressedPercentage=0.65)
        resp = TGetOperationStatusResp(operationState=TOperationState.RUNNING_STATE,
                                       progressUpdateResponse=progress_resp)
        hive_cursor = HiveCursor(None)
        hive_cursor._update_percent_complete(resp)
        self.assertEqual(hive_cursor._percent_complete, 65)

    def test_progress_old_hive_version(self):
        task_status_json = '[{"taskType": "MAPRED", "mapProgress": 50, "reduceProgress": 0 }]'
        resp = TGetOperationStatusResp(operationState=TOperationState.RUNNING_STATE,
                                       taskStatus=task_status_json)
        hive_cursor = HiveCursor(None)
        hive_cursor._update_percent_complete(resp)
        self.assertEqual(hive_cursor._percent_complete, 25)

