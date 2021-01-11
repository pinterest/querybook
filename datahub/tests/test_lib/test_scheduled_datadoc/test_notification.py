from unittest import mock, TestCase
from const.schedule import NotifyOn
from lib.scheduled_datadoc.notification import (
    _should_notify,
    _get_datadoc_notification_params,
)


class ShouldNotifyTestCase(TestCase):
    def test_should_notify(self):
        self.assertTrue(_should_notify("email", NotifyOn.ON_SUCCESS.value, True))
        self.assertTrue(_should_notify("email", NotifyOn.ON_FAILURE.value, False))
        self.assertTrue(_should_notify("email", NotifyOn.ALL.value, False))
        self.assertTrue(_should_notify("email", NotifyOn.ALL.value, True))

    def test_should_not_notify(self):
        self.assertFalse(_should_notify(None, NotifyOn.ON_SUCCESS.value, True))
        self.assertFalse(_should_notify("email", NotifyOn.ON_FAILURE.value, True))
        self.assertFalse(_should_notify("email", NotifyOn.ON_SUCCESS.value, False))


sample_params = {
    "is_success": False,
    "doc_title": "Hello World",
    "doc_url": "/foobar/datadoc/1/",
    "doc_id": 1,
    "export_urls": ["example.com", "foobarbaz.com"],
    "error_msg": "Some error occurred",
}


class GetDataDocNotificationParamsTestCase(TestCase):
    @mock.patch("lib.scheduled_datadoc.notification.get_data_doc_by_id")
    def test_standard(self, mock_get_doc):
        mock_doc = mock.MagicMock()
        mock_doc.title = "Hello World"
        mock_doc.environment.name = "foobar"
        mock_get_doc.return_value = mock_doc

        self.assertEqual(
            _get_datadoc_notification_params(
                1,
                False,
                "Some error occurred",
                ["example.com", "foobarbaz.com"],
                session=mock.MagicMock(),
            ),
            sample_params,
        )
