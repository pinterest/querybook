from unittest.mock import MagicMock

import pytest

from app.auth import permission
from app.datasource import RequestException
from querybook.server.const.datasources import ACCESS_RESTRICTED_STATUS_CODE


class TestVerifyEveryEnvironmentPermission:
    @pytest.fixture
    def fake_user(self):
        user = MagicMock()
        user.environment_ids = [1, 3]
        return user

    @pytest.fixture
    def fake_verify_safe_environment_access(self):
        verify_safe_environment_access = MagicMock()
        verify_safe_environment_access.side_effect = None
        return verify_safe_environment_access

    @pytest.fixture(autouse=True)
    def setup_mocks(
        self,
        monkeypatch,
        fake_user,
        fake_verify_safe_environment_access,
    ):
        monkeypatch.setattr(permission, "current_user", fake_user)
        monkeypatch.setattr(
            permission,
            "verify_safe_environment_access",
            fake_verify_safe_environment_access,
        )

    def test_rejects_when_user_does_not_have_access_to_every_environment(self):
        with pytest.raises(Exception) as error:
            permission.verify_every_environment_permission([1, 2])

        assert isinstance(error.value, RequestException)
        assert error.value.status_code == ACCESS_RESTRICTED_STATUS_CODE

    def test_allows_when_user_has_access_to_every_environment(self):
        permission.verify_every_environment_permission([1, 3])

        assert True

    def test_allows_when_user_has_access_to_some_environment(self):
        permission.verify_every_environment_permission([3])

        assert True


class TestVerifySafeEnvironmentAccess:
    @pytest.fixture(autouse=True)
    def safe_environments(self, monkeypatch):
        monkeypatch.setattr(permission.QuerybookSettings, "SAFE_ENVIRONMENTS", [1])

    def test_allows_safe_environment_without_calling_hook(self, monkeypatch):
        hook = MagicMock()
        monkeypatch.setattr(permission, "check_restricted_query_access", hook)

        permission.verify_safe_environment_access([1])

        hook.assert_not_called()

    def test_forwards_environment_ids_to_hook(self, monkeypatch):
        hook = MagicMock(return_value=True)
        monkeypatch.setattr(permission, "check_restricted_query_access", hook)

        permission.verify_safe_environment_access([53])

        hook.assert_called_once_with(environment_ids=[53])

    def test_rejects_when_hook_denies(self, monkeypatch):
        monkeypatch.setattr(
            permission, "check_restricted_query_access", MagicMock(return_value=False)
        )

        with pytest.raises(RequestException) as error:
            permission.verify_safe_environment_access([53])

        assert error.value.status_code == ACCESS_RESTRICTED_STATUS_CODE


class TestVerifySafeQueryEngineAccess:
    @pytest.fixture(autouse=True)
    def safe_query_engines(self, monkeypatch):
        monkeypatch.setattr(permission.QuerybookSettings, "SAFE_QUERY_ENGINES", [1])

    def test_allows_safe_engine_without_calling_hook(self, monkeypatch):
        hook = MagicMock()
        monkeypatch.setattr(permission, "check_restricted_query_access", hook)

        permission.verify_safe_query_engine_access([1])

        hook.assert_not_called()

    def test_forwards_query_engine_ids_to_hook(self, monkeypatch):
        hook = MagicMock(return_value=True)
        monkeypatch.setattr(permission, "check_restricted_query_access", hook)

        permission.verify_safe_query_engine_access([152])

        hook.assert_called_once_with(query_engine_ids=[152])

    def test_rejects_when_hook_denies(self, monkeypatch):
        monkeypatch.setattr(
            permission, "check_restricted_query_access", MagicMock(return_value=False)
        )

        with pytest.raises(RequestException) as error:
            permission.verify_safe_query_engine_access([152])

        assert error.value.status_code == ACCESS_RESTRICTED_STATUS_CODE
