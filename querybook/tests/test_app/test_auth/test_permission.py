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
    def fake_verify_api_access_token_environment_permission(self):
        verify_api_access_token_environment_permission = MagicMock()
        verify_api_access_token_environment_permission.side_effect = None
        return verify_api_access_token_environment_permission

    @pytest.fixture(autouse=True)
    def setup_mocks(
        self,
        monkeypatch,
        fake_user,
        fake_verify_api_access_token_environment_permission,
    ):
        monkeypatch.setattr(permission, "current_user", fake_user)
        monkeypatch.setattr(
            permission,
            "verify_api_access_token_environment_permission",
            fake_verify_api_access_token_environment_permission,
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
