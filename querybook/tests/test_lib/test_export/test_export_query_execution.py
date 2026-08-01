from unittest import TestCase, mock

from tasks.export_query_execution import export_query_execution_task


class ExportQueryExecutionTaskTestCase(TestCase):
    def setUp(self):
        self.exporter = mock.Mock(exporter_type="url")
        self.get_exporter_patch = mock.patch(
            "tasks.export_query_execution.get_exporter", return_value=self.exporter
        )
        self.get_exporter_patch.start()
        self.addCleanup(self.get_exporter_patch.stop)

    def test_preserves_legacy_url_string_result(self):
        self.exporter.export.return_value = "https://example.com/export"

        result = export_query_execution_task.run(
            "Example exporter", 1, 2, {"format": "csv"}
        )

        self.assertEqual(
            result,
            {"type": "url", "info": "https://example.com/export"},
        )

    def test_preserves_structured_url_result(self):
        export_result = {
            "url": "https://example.com/export",
            "message": "Your export contains filtered rows.",
            "message_type": "warning",
        }
        self.exporter.export.return_value = export_result

        result = export_query_execution_task.run("Example exporter", 1, 2, {})

        self.assertEqual(result, {"type": "url", "info": export_result})