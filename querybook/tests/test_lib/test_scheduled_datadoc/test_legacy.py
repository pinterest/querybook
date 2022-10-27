from unittest import TestCase, mock
from lib.scheduled_datadoc.legacy import convert_if_legacy_datadoc_schedule


class LegacyScheduleTestCase(TestCase):
    unchanged_fields = {
        "doc_id": 1,
        "user_id": 1,
    }

    legacy_exporter_fields = {
        "exporter_cell_id": 1,
        "exporter_name": "foobar",
        "exporter_params": {},
    }
    legacy_exporter_fields_semi = {
        "exporter_name": "foobar",
        "exporter_params": {},
    }

    legacy_notification_fields_email = {
        "notify_with": "email",
        "notify_on": 0,
    }
    legacy_notification_fields_slack = {
        "notify_with": "slack",
        "notify_on": 0,
    }

    new_exporter_fields = {
        "exports": [
            {"exporter_cell_id": 1, "exporter_name": "foobar", "exporter_params": {}}
        ]
    }
    new_exporter_fields_semi = {"exports": []}

    new_notification_fields_email = {
        "notifications": [{"with": "email", "on": 0, "config": {"to_user": [1]}}],
    }
    new_notification_fields_slack = {
        "notifications": [{"with": "slack", "on": 0, "config": {"to_user": [1]}}],
    }

    current_config_email = {
        **unchanged_fields,
        **new_notification_fields_email,
        **new_exporter_fields,
    }

    current_config_slack = {
        **unchanged_fields,
        **new_notification_fields_slack,
        **new_exporter_fields,
    }

    current_config_email_semi = {
        **unchanged_fields,
        **new_notification_fields_email,
        **new_exporter_fields_semi,
    }

    current_config_slack_semi = {
        **unchanged_fields,
        **new_notification_fields_slack,
        **new_exporter_fields_semi,
    }

    def test_convert_current(self):
        assert (
            convert_if_legacy_datadoc_schedule(self.current_config_email)
            == self.current_config_email
        )
        assert (
            convert_if_legacy_datadoc_schedule(self.current_config_slack)
            == self.current_config_slack
        )

    def test_convert_legacy_config(self):

        # leagcy exporter + legacy slack notification
        assert (
            convert_if_legacy_datadoc_schedule(
                {
                    **self.unchanged_fields,
                    **self.legacy_notification_fields_email,
                    **self.legacy_exporter_fields,
                }
            )
            == self.current_config_email
        )

        # leagcy exporter + legacy email notification
        assert (
            convert_if_legacy_datadoc_schedule(
                {
                    **self.unchanged_fields,
                    **self.legacy_notification_fields_email,
                    **self.legacy_exporter_fields_semi,
                }
            )
            == self.current_config_email_semi
        )

        # leagcy semi exporter + legacy slack notification
        assert (
            convert_if_legacy_datadoc_schedule(
                {
                    **self.unchanged_fields,
                    **self.legacy_notification_fields_slack,
                    **self.legacy_exporter_fields,
                }
            )
            == self.current_config_slack
        )

        # leagcy semi exporter + legacy email notification
        assert (
            convert_if_legacy_datadoc_schedule(
                {
                    **self.unchanged_fields,
                    **self.legacy_notification_fields_slack,
                    **self.legacy_exporter_fields_semi,
                }
            )
            == self.current_config_slack_semi
        )

    def test_convert_unchanged(self):
        assert (
            convert_if_legacy_datadoc_schedule(self.unchanged_fields)
            == self.unchanged_fields
        )
