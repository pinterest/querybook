from unittest.mock import MagicMock

import pytest

from datasources import query_execution as query_execution_ds


class TestDeleteQueryExecutionViewer:
    @pytest.fixture
    def delete_mock(self, monkeypatch):
        mock = MagicMock(return_value={"ok": True})
        monkeypatch.setattr(query_execution_ds.QueryExecutionViewer, "delete", mock)
        return mock

    def test_verifies_owner_before_delete(self, monkeypatch, delete_mock):
        verify_owner_mock = MagicMock()
        monkeypatch.setattr(
            query_execution_ds, "verify_query_execution_owner", verify_owner_mock
        )

        query_execution_ds.delete_query_execution_viewer.__raw__(execution_id=123)

        verify_owner_mock.assert_called_once_with(123)
        delete_mock.assert_called_once_with(123)

    def test_blocks_delete_when_not_owner(self, monkeypatch, delete_mock):
        monkeypatch.setattr(
            query_execution_ds,
            "verify_query_execution_owner",
            MagicMock(side_effect=PermissionError("NOT_QUERY_OWNER")),
        )

        with pytest.raises(PermissionError):
            query_execution_ds.delete_query_execution_viewer.__raw__(execution_id=123)

        delete_mock.assert_not_called()
