from contextlib import contextmanager
from unittest.mock import MagicMock

import pytest

from datasources import board as board_ds


@pytest.fixture
def fake_db_session():
    @contextmanager
    def _ctx():
        yield object()

    return _ctx


@pytest.fixture
def fake_board():
    board = MagicMock()
    board.to_dict.return_value = {"id": 1}
    return board


@pytest.fixture(autouse=True)
def common_board_setup(monkeypatch, fake_db_session, fake_board):
    monkeypatch.setattr(board_ds, "DBSession", fake_db_session)
    monkeypatch.setattr(board_ds, "assert_can_edit", lambda *args, **kwargs: None)
    monkeypatch.setattr(board_ds.Board, "get", lambda *args, **kwargs: fake_board)


@pytest.fixture
def update_board_mock(monkeypatch, fake_board):
    mock = MagicMock(return_value=fake_board)
    monkeypatch.setattr(board_ds.logic, "update_board", mock)
    return mock


class TestUpdateBoard:
    def test_rejects_non_owner_owner_uid_change(self, monkeypatch, update_board_mock):
        owner_check = MagicMock(side_effect=PermissionError("NOT_BOARD_OWNER"))
        monkeypatch.setattr(board_ds, "assert_is_owner", owner_check)

        with pytest.raises(PermissionError):
            board_ds.update_board.__raw__(board_id=1, owner_uid=2)

        owner_check.assert_called_once()
        update_board_mock.assert_not_called()

    def test_rejects_non_owner_owner_uid_null(self, monkeypatch, update_board_mock):
        owner_check = MagicMock(side_effect=PermissionError("NOT_BOARD_OWNER"))
        monkeypatch.setattr(board_ds, "assert_is_owner", owner_check)

        with pytest.raises(PermissionError):
            board_ds.update_board.__raw__(board_id=1, owner_uid=None)

        owner_check.assert_called_once()
        update_board_mock.assert_not_called()

    def test_allows_owner_owner_uid_change(
        self, monkeypatch, update_board_mock, fake_board
    ):
        monkeypatch.setattr(board_ds, "assert_is_owner", lambda *args, **kwargs: None)

        result = board_ds.update_board.__raw__(board_id=1, owner_uid=2)

        update_board_mock.assert_called_once()
        assert result == fake_board.to_dict.return_value
