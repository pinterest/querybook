from unittest import TestCase, mock
from lib.scheduled_datadoc.validator import (
    validate_dict_keys,
    validate_exporters_config,
    validate_datadoc_schedule_config,
    InvalidScheduleException,
)


class ValidateDictKeysTestCase(TestCase):
    test_dict = {"foo": "bar", "hello": "world"}

    def test_valid_dict(self):
        validate_dict_keys(self.test_dict, ["foo", "hello"])

    def test_valid_dict_with_extra_keys(self):
        validate_dict_keys(self.test_dict, ["foo", "hello", "bar"])

    def test_invalid_dict(self):
        with self.assertRaises(InvalidScheduleException):
            validate_dict_keys(self.test_dict, ["hello", "bar"])


def mock_get_exporter(name: str):
    if name != "export_to_table":
        raise ValueError("Invalid exporter")
    exporter = mock.MagicMock()
    exporter.export_form = None
    return exporter


class ValidateExportersConfigTestCase(TestCase):
    def setUp(self):
        patch_get_exporter = mock.patch(
            "lib.scheduled_datadoc.validator.get_exporter",
            side_effect=mock_get_exporter,
        )
        self.addCleanup(patch_get_exporter.stop)
        self.mock_get_exporter = patch_get_exporter.start()

    @mock.patch(
        "lib.scheduled_datadoc.validator.validate_form", return_value=(True, "")
    )
    def test_valid_config(self, mock_get_exporter):
        validate_exporters_config(
            [
                {
                    "exporter_cell_id": 1,
                    "exporter_name": "export_to_table",
                    "exporter_params": {"table": "a"},
                },
                {
                    "exporter_cell_id": 2,
                    "exporter_name": "export_to_table",
                    "exporter_params": {"table": "b"},
                },
            ]
        )

    def test_missing_exporter_cell_id(self):
        with self.assertRaises(InvalidScheduleException):
            validate_exporters_config(
                [{"exporter_name": "not_exists", "exporter_params": {"table": "a"}}]
            )

    def test_invalid_exporter_name(self):
        with self.assertRaises(InvalidScheduleException):
            validate_exporters_config(
                [
                    {
                        "exporter_cell_id": 1,
                        "exporter_name": "not_exists",
                        "exporter_params": {"table": "a"},
                    }
                ]
            )

    @mock.patch(
        "lib.scheduled_datadoc.validator.validate_form", return_value=(False, "Invalid")
    )
    def test_invalid_exporter_form(self, mock_validate_form):
        with self.assertRaises(InvalidScheduleException):
            validate_exporters_config(
                [
                    {
                        "exporter_cell_id": 1,
                        "exporter_name": "export_to_table",
                        "exporter_params": {"table": "a"},
                    }
                ]
            )


class ValidateDatadocScheduleConfigTestCase(TestCase):
    @mock.patch("lib.scheduled_datadoc.validator.validate_dict_keys")
    def test_invalid_dict(self, mock_validate_dict_keys):
        mock_validate_dict_keys.side_effect = InvalidScheduleException()
        self.assertFalse(validate_datadoc_schedule_config({})[0])

    @mock.patch("lib.scheduled_datadoc.validator.validate_dict_keys")
    @mock.patch("lib.scheduled_datadoc.validator.validate_exporters_config")
    def test_invalid_exporter(
        self, mock_validate_dict_keys, mock_validate_exporters_config
    ):
        mock_validate_exporters_config.side_effect = InvalidScheduleException()
        self.assertFalse(validate_datadoc_schedule_config({})[0])
        self.assertTrue(mock_validate_exporters_config.called)
