from copy import deepcopy
from typing import Dict, List, Optional, Tuple, Type, cast
from unittest.mock import MagicMock

import ldap
import pytest
from _pytest.monkeypatch import MonkeyPatch
from ldap.ldapobject import SimpleLDAPObject

from app.auth import ldap_auth
from app.auth.utils import AuthenticationError
from env import QuerybookSettings

LDAP_DIRECTORY_BASE = {
    "dc=querybook,dc=com": {
        "objectClass": [b"top", b"dcObject", b"organization"],
        "o": [b"Querybook"],
        "dc": [b"socialbakers"],
    },
    "ou=people,dc=querybook,dc=com": {
        "objectClass": [b"top", b"organizationalUnit"],
        "ou": b"people",
    },
}

BIND_USER_DN_UID = "uid=bind,ou=people,dc=querybook,dc=com"
BIND_USER_DN_CN = "cn=bind user,ou=people,dc=querybook,dc=com"
USER_DN_UID = "uid=newmaj,ou=people,dc=querybook,dc=com"
USER_DN_CN = "cn=John Newman,ou=people,dc=querybook,dc=com"

BIND_USER_INFO = {
    "cn": [b"Bind User"],
    "uid": [b"bind"],
    "userPassword": [b"bind123"],
    "objectClass": [b"organizationalPerson"],
}
USER_INFO = {
    "cn": [b"John Newman"],
    "givenName": [b"John"],
    "sn": [b"Newman"],
    "uid": [b"newmaj"],
    "mail": [b"jn@querybook.com"],
    "userPassword": [b"jn123"],
    "objectClass": [b"organizationalPerson"],
}

LDAP_DIRECTORY_UID = {
    **LDAP_DIRECTORY_BASE,
    BIND_USER_DN_UID: BIND_USER_INFO,
    USER_DN_UID: USER_INFO,
}

LDAP_DIRECTORY_CN = {
    **LDAP_DIRECTORY_BASE,
    BIND_USER_DN_CN: BIND_USER_INFO,
    USER_DN_CN: USER_INFO,
}


@pytest.fixture(autouse=True)
def settings(monkeypatch: MonkeyPatch) -> MonkeyPatch:
    monkeypatch.setattr(QuerybookSettings, "LDAP_CONN", "ldap://localhost:389")
    monkeypatch.setattr(
        QuerybookSettings, "LDAP_SEARCH", "ou=people,dc=querybook,dc=com"
    )
    monkeypatch.setattr(
        QuerybookSettings, "LDAP_USER_DN", "uid={},ou=people,dc=querybook,dc=com"
    )
    monkeypatch.setattr(
        QuerybookSettings, "LDAP_BIND_USER", "uid=bind,ou=people,dc=querybook,dc=com"
    )
    monkeypatch.setattr(QuerybookSettings, "LDAP_BIND_PASSWORD", "bind123")
    monkeypatch
    yield
    monkeypatch.undo()


from abc import ABC, abstractmethod


class MockLdap(ABC):
    def __init__(self):
        self.mock_search_s = MagicMock(side_effect=self._search_s)
        self.mock_simple_bind_s = MagicMock(side_effect=self._simple_bind_s)

    @staticmethod
    @abstractmethod
    def _simple_bind_s(who: str, cred: str) -> Tuple:
        pass

    @staticmethod
    @abstractmethod
    def _search_s(
        base: str, scope: int, filterstr: str, attrlist: List[str]
    ) -> List[Tuple]:
        pass

    def simple_bind_s(self, **kwargs) -> Tuple:
        return self.mock_simple_bind_s(**kwargs)

    def search_s(self, **kwargs) -> Tuple:
        return self.mock_search_s(**kwargs)


class MockLdapUID(MockLdap):
    @staticmethod
    def _simple_bind_s(who: str, cred: str) -> Tuple:
        if who == USER_DN_UID and cred == "jn123":
            return 97, [], 1, []
        elif who == BIND_USER_DN_UID and cred == "bind123":
            return 97, [], 2, []
        raise ldap.INVALID_CREDENTIALS()

    @staticmethod
    def _search_s(
        base: str, scope: int, filterstr: str, attrlist: List[str]
    ) -> List[Tuple]:
        if (
            (filterstr == "(&(uid=unknown)(objectClass=*))")
            or (filterstr == "(&(uid=newmaj)(sn=Unknown))")
            or (filterstr == "(sn=Unknown)")
            or (base == "uid=unknown,ou=people,dc=querybook,dc=com")
            or (base == "uid=newmaj,ou=people,dc=querybook,dc=unknown")
            or (base == "cn=John Newman,ou=people,dc=querybook,dc=com")
        ):
            return []
        elif scope == 2 and (
            (
                base == "ou=people,dc=querybook,dc=com"
                and filterstr == "(&(uid=newmaj)(objectClass=*))"
            )
            or (
                base == "ou=people,dc=querybook,dc=com"
                and filterstr == "(&(uid=newmaj)(sn=Newman))"
            )
            or (
                base == "uid=newmaj,ou=people,dc=querybook,dc=com"
                and filterstr == "(objectClass=*)"
            )
            or (
                base == "uid=newmaj,ou=people,dc=querybook,dc=com"
                and filterstr == "(sn=Newman)"
            )
        ):
            return [
                (
                    USER_DN_UID,
                    {
                        k: v
                        for k, v in USER_INFO.items()
                        if (k in attrlist if attrlist else True)
                    },
                )
            ]
        raise RuntimeError("Unsupported mock")


class MockLdapCN(MockLdap):
    @staticmethod
    def _simple_bind_s(who: str, cred: str) -> Tuple:
        if who == USER_DN_CN and cred == "jn123":
            return 97, [], 1, []
        elif who == BIND_USER_DN_CN and cred == "bind123":
            return 97, [], 2, []
        raise ldap.INVALID_CREDENTIALS()

    @staticmethod
    def _search_s(
        base: str, scope: int, filterstr: str, attrlist: List[str]
    ) -> List[Tuple]:
        if scope == 2 and (
            (
                base == "ou=people,dc=querybook,dc=com"
                and filterstr == "(&(uid=newmaj)(objectClass=*))"
            )
            or (
                base == "cn=John Newman,ou=people,dc=querybook,dc=com"
                and filterstr == "(objectClass=*)"
            )
        ):
            return [
                (
                    USER_DN_CN,
                    {
                        k: v
                        for k, v in USER_INFO.items()
                        if (k in attrlist if attrlist else True)
                    },
                )
            ]
        raise RuntimeError("Unsupported mock")


@pytest.fixture
def mock_ldap_uid() -> SimpleLDAPObject:
    return cast(SimpleLDAPObject, MockLdapUID())


@pytest.fixture
def mock_ldap_cn() -> SimpleLDAPObject:
    return cast(SimpleLDAPObject, MockLdapCN())


@pytest.mark.parametrize(
    "user_dn, password, result",
    [
        ("cn=John Newman,ou=people,dc=querybook,dc=com", "jn123", True),
        ("cn=John Newman,ou=group,dc=querybook,dc=com", "jn123", False),
        ("cn=John Badman,ou=people,dc=querybook,dc=com", "123", False),
        ("cn=John Newman,ou=people,dc=querybook,dc=com", "password", False),
    ],
)
def test_ldap_authenticate_cn(
    mock_ldap_cn: SimpleLDAPObject, user_dn: str, password: str, result: bool
):
    assert (
        ldap_auth.ldap_authenticate(mock_ldap_cn, user_dn=user_dn, password=password)
        == result
    )


@pytest.mark.parametrize(
    "user_dn, password, result",
    [
        ("uid=newmaj,ou=people,dc=querybook,dc=com", "jn123", True),
        ("uid=newmaj,ou=group,dc=querybook,dc=com", "jn123", False),
        ("uid=newmaa,ou=people,dc=querybook,dc=com", "jn123", False),
        ("uid=newmaj,ou=people,dc=querybook,dc=com", "password", False),
    ],
)
def test_ldap_authenticate_uid(
    mock_ldap_uid: SimpleLDAPObject, user_dn: str, password: str, result: bool
):
    assert (
        ldap_auth.ldap_authenticate(mock_ldap_uid, user_dn=user_dn, password=password)
        == result
    )


@pytest.mark.parametrize(
    "username, use_bind, user_dn, exp_username, expected_dn, exp_error",
    [
        (
            "newmaj",
            True,
            None,
            "newmaj",
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            None,
        ),
        (
            "newmaj",
            False,
            "uid={},ou=people,dc=querybook,dc=com",
            "newmaj",
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            None,
        ),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            True,
            None,
            "newmaj",
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            None,
        ),
        (
            "cn=John Newman,ou=people,dc=querybook,dc=com",
            True,
            None,
            None,
            None,
            AuthenticationError,
        ),  # using CN DN on UID based LDAP
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            False,
            "uid={},ou=people,dc=querybook,dc=com",
            "newmaj",
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            None,
        ),
        (
            "cn=John Newman,ou=people,dc=querybook,dc=com",
            False,
            "cn={},ou=people,dc=querybook,dc=com",
            "John Newman",
            "cn=John Newman,ou=people,dc=querybook,dc=com",
            None,
        ),
        (
            "cn=John Newman,ou=people,dc=querybook,dc=com",
            False,
            "uid={},ou=people,dc=querybook,dc=com",
            None,
            None,
            ValueError,
        ),
    ],
)
def test_ldap_get_transformed_username_uid(
    monkeypatch: MonkeyPatch,
    mock_ldap_uid: SimpleLDAPObject,
    username: str,
    use_bind: bool,
    user_dn: Optional[str],
    exp_username: Optional[str],
    expected_dn: Optional[str],
    exp_error: Optional[Type[Exception]],
):
    monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", use_bind)
    monkeypatch.setattr(QuerybookSettings, "LDAP_USER_DN", user_dn)
    try:
        username, dn = ldap_auth.get_transformed_username(mock_ldap_uid, username)
    except Exception as exception:
        if not isinstance(exception, exp_error):
            raise exception
    else:
        assert username == exp_username
        assert dn == expected_dn


@pytest.mark.parametrize(
    "ldap_filter, use_bind, exp_filter",
    [
        ("uid=newmaj", True, "(uid=newmaj)"),
        ("(uid=newmaj)", True, "(uid=newmaj)"),
        (None, True, "(objectClass=*)"),
        ("(uid=newmaj)", False, "(objectClass=*)"),
    ],
)
def test_get_ldap_filter(
    monkeypatch: MonkeyPatch, ldap_filter: str, use_bind: bool, exp_filter: str
) -> None:
    monkeypatch.setattr(QuerybookSettings, "LDAP_FILTER", ldap_filter)
    monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", use_bind)
    assert ldap_auth._get_ldap_filter() == exp_filter


@pytest.mark.parametrize(
    "uid, attrs, ldap_filter, exp_res",
    [
        (
            "newmaj",
            ["mail"],
            None,
            (
                "uid=newmaj,ou=people,dc=querybook,dc=com",
                {"mail": [b"jn@querybook.com"]},
            ),
        ),
        (
            "newmaj",
            ["mail"],
            "(sn=Newman)",
            (
                "uid=newmaj,ou=people,dc=querybook,dc=com",
                {"mail": [b"jn@querybook.com"]},
            ),
        ),
        ("newmaj", ["mail"], "(sn=Unknown)", None),
        ("unknown", ["mail"], None, None),
    ],
)
def test_search_by_uid(
    monkeypatch: MonkeyPatch,
    mock_ldap_uid: SimpleLDAPObject,
    uid: str,
    attrs: List[str],
    ldap_filter: Optional[str],
    exp_res: Optional[Tuple[str, Dict]],
) -> None:
    if ldap_filter:
        monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", True)
        monkeypatch.setattr(QuerybookSettings, "LDAP_FILTER", ldap_filter)
    assert (
        ldap_auth.search_user_by_uid(
            mock_ldap_uid, uid, attrs=attrs, apply_filter=bool(ldap_filter)
        )
        == exp_res
    )


@pytest.mark.parametrize(
    "user_dn, attrs, ldap_filter, exp_res",
    [
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            ["mail"],
            None,
            (
                "uid=newmaj,ou=people,dc=querybook,dc=com",
                {"mail": [b"jn@querybook.com"]},
            ),
        ),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            ["mail"],
            "(sn=Newman)",
            (
                "uid=newmaj,ou=people,dc=querybook,dc=com",
                {"mail": [b"jn@querybook.com"]},
            ),
        ),
        ("uid=newmaj,ou=people,dc=querybook,dc=com", ["mail"], "(sn=Unknown)", None),
        ("uid=unknown,ou=people,dc=querybook,dc=com", ["mail"], None, None),
    ],
)
def test_search_by_dn(
    monkeypatch: MonkeyPatch,
    mock_ldap_uid: SimpleLDAPObject,
    user_dn: str,
    attrs: List[str],
    ldap_filter: Optional[str],
    exp_res: Optional[Tuple[str, Dict]],
) -> None:
    if ldap_filter:
        monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", True)
        monkeypatch.setattr(QuerybookSettings, "LDAP_FILTER", ldap_filter)
    assert (
        ldap_auth.search_user_by_dn(
            mock_ldap_uid, user_dn=user_dn, attrs=attrs, apply_filter=bool(ldap_filter)
        )
        == exp_res
    )


def test_parse_user_info() -> None:
    assert ldap_auth._parse_user_info(
        ("dn", {"mail": "email", "cn": "cn", "givenName": "fn", "sn": "ln"})
    ) == ldap_auth.LDAPUserInfo(
        dn="dn", cn="cn", first_name="fn", last_name="ln", email="email"
    )


@pytest.mark.parametrize(
    "user_dn, password, ldap_filter, error_message",
    [
        ("uid=newmaj,ou=people,dc=querybook,dc=com", "jn123", None, None),
        ("uid=unknown,ou=people,dc=querybook,dc=com", "jn123", None, "Bad credentials"),
        ("uid=newmaj,ou=people,dc=querybook,dc=com", "xxxxx", None, "Bad credentials"),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=unknown",
            "jn123",
            None,
            "Bad credentials",
        ),
        (
            "cn=John Newman,ou=people,dc=querybook,dc=com",
            "jn123",
            None,
            "Bad credentials",
        ),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            "jn123",
            "(sn=Unknown)",
            "Unauthorized",
        ),
    ],
)
def test_authenticate_user_by_bind_connection(
    monkeypatch: MonkeyPatch,
    user_dn: str,
    password: str,
    ldap_filter: Optional[str],
    error_message: Optional[str],
    mock_ldap_uid: SimpleLDAPObject,
) -> None:
    mock_bind_ldap_uid = deepcopy(mock_ldap_uid)
    monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", True)
    monkeypatch.setattr(QuerybookSettings, "LDAP_FILTER", ldap_filter)
    monkeypatch.setattr(
        QuerybookSettings, "LDAP_SEARCH", "ou=people,dc=querybook,dc=com"
    )
    if error_message:
        with pytest.raises(AuthenticationError) as error:
            ldap_auth.authenticate_user_by_bind_connection(
                user_dn=user_dn,
                password=password,
                bind_conn=mock_bind_ldap_uid,
                user_conn=mock_ldap_uid,
            )
        assert error_message in str(error.value)
    else:
        ldap_auth.authenticate_user_by_bind_connection(
            user_dn=user_dn,
            password=password,
            bind_conn=mock_bind_ldap_uid,
            user_conn=mock_ldap_uid,
        ).email == "jn@querybook.com"


@pytest.mark.parametrize(
    "user_dn, password, error_type, error_message",
    [
        ("uid=newmaj,ou=people,dc=querybook,dc=com", "jn123", None, None),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=com",
            "xxxxx",
            AuthenticationError,
            "Bad credentials",
        ),
        ("xxxxxx", "jn123", AuthenticationError, "Bad credentials"),
        (
            "uid=newmaj,ou=people,dc=querybook,dc=xxx",
            "jn123",
            AuthenticationError,
            "Bad credentials",
        ),
    ],
)
def test_authenticate_user_by_direct_connection(
    monkeypatch: MonkeyPatch,
    user_dn: str,
    password: str,
    error_type: Type[Exception],
    error_message: Optional[str],
    mock_ldap_uid: SimpleLDAPObject,
) -> None:
    monkeypatch.setattr(QuerybookSettings, "LDAP_USE_BIND_USER", False)
    monkeypatch.setattr(
        QuerybookSettings, "LDAP_USER_DN", "uid={},ou=people,dc=querybook,dc=com"
    )
    if error_message:
        with pytest.raises(error_type) as error:
            ldap_auth.authenticate_user_by_direct_connection(
                user_dn=user_dn, password=password, user_conn=mock_ldap_uid
            )
        assert error_message in str(error.value)
    else:
        ldap_auth.authenticate_user_by_direct_connection(
            user_dn, password, mock_ldap_uid
        )
