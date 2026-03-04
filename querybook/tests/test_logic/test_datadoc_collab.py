from unittest.mock import MagicMock

import pytest

from logic import datadoc_collab


@pytest.fixture
def fake_doc():
    doc = MagicMock()
    doc.to_dict.return_value = {"id": 1}
    return doc


@pytest.fixture(autouse=True)
def common_datadoc_setup(monkeypatch):
    monkeypatch.setattr(
        datadoc_collab, "assert_can_write", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(
        datadoc_collab, "verify_data_doc_permission", lambda *args, **kwargs: None
    )
    monkeypatch.setattr(datadoc_collab.socketio, "emit", lambda *args, **kwargs: None)


class TestUpdateDatadoc:
    @pytest.fixture
    def update_doc_mock(self, monkeypatch, fake_doc):
        mock = MagicMock(return_value=fake_doc)
        monkeypatch.setattr(datadoc_collab.logic, "update_data_doc", mock)
        return mock

    def test_rejects_non_owner_owner_uid_change(self, monkeypatch, update_doc_mock):
        owner_check = MagicMock(side_effect=PermissionError("NOT_DATADOC_OWNER"))
        monkeypatch.setattr(datadoc_collab, "assert_is_owner", owner_check)

        with pytest.raises(PermissionError):
            datadoc_collab.update_datadoc(
                doc_id=1,
                fields={"owner_uid": 2},
                session=object(),
            )

        owner_check.assert_called_once()
        update_doc_mock.assert_not_called()

    def test_rejects_non_owner_owner_uid_null(self, monkeypatch, update_doc_mock):
        owner_check = MagicMock(side_effect=PermissionError("NOT_DATADOC_OWNER"))
        monkeypatch.setattr(datadoc_collab, "assert_is_owner", owner_check)

        with pytest.raises(PermissionError):
            datadoc_collab.update_datadoc(
                doc_id=1,
                fields={"owner_uid": None},
                session=object(),
            )

        owner_check.assert_called_once()
        update_doc_mock.assert_not_called()

    def test_allows_owner_owner_uid_change(
        self, monkeypatch, update_doc_mock, fake_doc
    ):
        monkeypatch.setattr(
            datadoc_collab, "assert_is_owner", lambda *args, **kwargs: None
        )

        result = datadoc_collab.update_datadoc(
            doc_id=1,
            fields={"owner_uid": 2},
            session=object(),
        )

        update_doc_mock.assert_called_once()
        assert result == fake_doc.to_dict.return_value
