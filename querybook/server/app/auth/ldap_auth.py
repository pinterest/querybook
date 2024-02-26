from contextlib import contextmanager
from dataclasses import dataclass
from typing import Dict, Iterator, List, Optional, Tuple, Union

import ldap
import flask_login
import re
from ldap.ldapobject import SimpleLDAPObject

from flask_login import current_user
from env import QuerybookSettings
from app.db import with_session, DBSession
from .utils import AuthenticationError, AuthUser, QuerybookLoginManager
from lib.logger import get_logger
from logic.user import (
    get_user_by_name,
    create_user,
)
from models.user import User

LOG = get_logger(__file__)

login_manager = QuerybookLoginManager()


class LDAPAuthErrors:
    BAD_CREDENTIALS = "Bad credentials"
    UNAUTHORIZED = "Unauthorized"


@dataclass
class LDAPUserInfo:
    LDAP_ATTRS = [
        QuerybookSettings.LDAP_FULLNAME_FIELD,  # default: cn
        QuerybookSettings.LDAP_FIRSTNAME_FIELD,  # default: givenName
        QuerybookSettings.LDAP_EMAIL_FIELD,  # default: mail
        QuerybookSettings.LDAP_LASTNAME_FIELD,  # default: sn
    ]

    cn: Optional[str] = None
    dn: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    @property
    def full_name(self) -> str:
        full_name = " ".join(filter(bool, [self.first_name, self.last_name]))
        return full_name if full_name else self.cn


def _sanitize_ldap_search_results(
    search_results: List[Tuple],
) -> Optional[Tuple[str, Dict]]:
    # Remove any search referrals from results
    cleared_results = [
        (dn, attrs)
        for dn, attrs in search_results
        if dn is not None and isinstance(attrs, dict)
    ]
    n_found = len(cleared_results)
    if n_found != 1:
        if n_found > 1:
            LOG.warning(f"LDAP search returned {n_found} results")
        return None
    return cleared_results[0]


def _get_ldap_filter() -> str:
    search_filter = (
        QuerybookSettings.LDAP_FILTER
        if QuerybookSettings.LDAP_USE_BIND_USER and QuerybookSettings.LDAP_FILTER
        else "(objectClass=*)"
    )

    if QuerybookSettings.LDAP_FILTER and not QuerybookSettings.LDAP_USE_BIND_USER:
        LOG.warning(
            "LDAP_FILTER is going to be ignored when LDAP_USE_BIND_USER is not True"
        )

    if search_filter and not re.match("\\(.*\\)", search_filter):
        search_filter = f"({search_filter})"

    return search_filter


def _parse_value(value: Union[bytes, str, List[Union[bytes, str]]]) -> str:
    if isinstance(value, List):
        value = value[0]
    if isinstance(value, bytes):
        return value.decode("utf-8")
    return value


def _parse_user_info(ldap_user_info: Tuple[str, Dict]) -> LDAPUserInfo:
    try:
        user_info = ldap_user_info[1]
        return LDAPUserInfo(
            cn=_parse_value(user_info[QuerybookSettings.LDAP_FULLNAME_FIELD]),
            dn=ldap_user_info[0],
            email=_parse_value(user_info[QuerybookSettings.LDAP_EMAIL_FIELD]),
            first_name=_parse_value(user_info[QuerybookSettings.LDAP_FIRSTNAME_FIELD]),
            last_name=_parse_value(user_info[QuerybookSettings.LDAP_LASTNAME_FIELD]),
        )

    except (IndexError, NameError):
        LOG.error(f"Failed to parse UserInfo from: {ldap_user_info}")
        raise AuthenticationError("Failed to parse user information")


def ldap_authenticate(ldap_conn: SimpleLDAPObject, user_dn: str, password: str):
    """Validates/binds the provided dn/password with the LDAP sever."""
    try:
        LOG.debug(f"LDAP bind TRY with username: '{user_dn}'")
        ldap_conn.simple_bind_s(who=user_dn, cred=password)
        LOG.debug(f"LDAP bind SUCCESS with username: '{user_dn}'")
        return True
    except ldap.INVALID_CREDENTIALS:
        return False


@with_session
def login_user(username: str, email: str, full_name: str, session=None):
    if not username or not isinstance(username, str):
        raise AuthenticationError("Please provide a valid username")

    # Case-insensitive search of the user for backward compatibility.
    # Because it was possible to create e.g. uppercase usernames before.
    user = get_user_by_name(username, case_sensitive=False, session=session)
    if not user:
        # Usernames of new LDAP users are lowered in the DB in order to prevent storing
        # randomly formatted strings from the user input.
        user = create_user(
            username=username.lower(), fullname=full_name, email=email, session=session
        )
    return user


def search_user_by_uid(
    ldap_conn: SimpleLDAPObject,
    uid: str = None,
    attrs: Optional[List[str]] = None,
    apply_filter: bool = False,
) -> Optional[Tuple[str, Dict]]:
    search_filter = (
        f"(&({QuerybookSettings.LDAP_UID_FIELD}={uid})"
        + (_get_ldap_filter() if apply_filter else "(objectClass=*)")
        + ")"
    )
    try:
        raw_search_result = ldap_conn.search_s(
            base=QuerybookSettings.LDAP_SEARCH,
            scope=ldap.SCOPE_SUBTREE,
            filterstr=search_filter,
            attrlist=attrs,
        )
    except ldap.NO_SUCH_OBJECT:
        return None
    return _sanitize_ldap_search_results(raw_search_result)


def search_user_by_dn(
    ldap_conn: SimpleLDAPObject,
    user_dn: str = None,
    attrs: Optional[List[str]] = None,
    apply_filter: bool = False,
) -> Optional[Tuple[str, Dict]]:
    try:
        filter_str = _get_ldap_filter() if apply_filter else "(objectClass=*)"
        raw_search_result = ldap_conn.search_s(
            base=user_dn,
            scope=ldap.SCOPE_SUBTREE,
            filterstr=filter_str,
            attrlist=attrs,
        )
    except ldap.NO_SUCH_OBJECT:
        return None
    return _sanitize_ldap_search_results(raw_search_result)


def get_transformed_username(
    ldap_conn: SimpleLDAPObject, username: str
) -> Tuple[str, str]:
    # Case when there is a username in form of DN
    if re.match(r"^\w+=.+", username):
        dn = username
        if QuerybookSettings.LDAP_USE_BIND_USER:
            search_result = search_user_by_dn(
                ldap_conn, user_dn=dn, attrs=[QuerybookSettings.LDAP_UID_FIELD]
            )
            if not search_result:
                # In case when provided DN wasn't found in LDAP
                raise AuthenticationError(LDAPAuthErrors.BAD_CREDENTIALS)
            username = _parse_value(search_result[1][QuerybookSettings.LDAP_UID_FIELD])
        else:
            match = re.match(
                QuerybookSettings.LDAP_USER_DN.replace("{}", "(.+?)"), username
            )
            if not match:
                raise ValueError(
                    f"Username in form of LDAP DN has to follow '{QuerybookSettings.LDAP_USER_DN}' pattern"
                )
            username = match.group(1)
    # Username in form of UID
    else:
        if QuerybookSettings.LDAP_USE_BIND_USER:
            search_result = search_user_by_uid(ldap_conn, uid=username)
            if not search_result:
                # In case when provided UID wasn't found in LDAP
                raise AuthenticationError(LDAPAuthErrors.BAD_CREDENTIALS)
            dn = search_result[0]
        else:
            dn = QuerybookSettings.LDAP_USER_DN.format(username)

    return username, dn


@contextmanager
def ldap_connection() -> Iterator[SimpleLDAPObject]:
    try:
        conn = ldap.initialize(QuerybookSettings.LDAP_CONN, trace_level=0)
        conn.set_option(ldap.OPT_REFERRALS, 0)
    except ldap.LDAPError as ldap_error:
        raise ConnectionError("Failed to create LDAP connection") from ldap_error

    if QuerybookSettings.LDAP_USE_TLS:
        try:
            conn.start_tls_s()
        except ldap.CONNECT_ERROR as connect_error:
            raise ConnectionError(
                "Failed to create LDAP TLS connection"
            ) from connect_error

    try:
        yield conn
    finally:
        conn.unbind_s()


def authenticate_user_by_bind_connection(
    user_dn: str,
    password: str,
    bind_conn: SimpleLDAPObject,
    user_conn: SimpleLDAPObject,
) -> LDAPUserInfo:
    # Try to connect with user credentials now
    if not ldap_authenticate(user_conn, user_dn=user_dn, password=password):
        raise AuthenticationError(LDAPAuthErrors.BAD_CREDENTIALS)

    # Get information about the session user using the bind user.
    # The filter is applied, so no results means the user isn't allowed.
    user_info_search = search_user_by_dn(
        bind_conn, user_dn=user_dn, attrs=LDAPUserInfo.LDAP_ATTRS, apply_filter=True
    )
    if not user_info_search:
        raise AuthenticationError(LDAPAuthErrors.UNAUTHORIZED)

    return _parse_user_info(user_info_search)


def authenticate_user_by_direct_connection(
    user_dn: str, password: str, user_conn: SimpleLDAPObject
) -> LDAPUserInfo:
    # Try to do direct authentication with the session user
    if not ldap_authenticate(user_conn, user_dn=user_dn, password=password):
        raise AuthenticationError(LDAPAuthErrors.BAD_CREDENTIALS)

    # In case of direct login, ldap_search may not be allowed for all users,
    # therefore it's not possible to obtain user details, but user should be allowed.
    user_info_search = search_user_by_dn(
        user_conn, user_dn=user_dn, attrs=LDAPUserInfo.LDAP_ATTRS
    )
    return (
        _parse_user_info(user_info_search)
        if user_info_search
        else LDAPUserInfo(dn=user_dn)
    )


def login_user_endpoint(username, password) -> Optional[User]:
    if current_user.is_authenticated:
        return

    if not username or not password:
        raise AuthenticationError("Missing username or password")

    if QuerybookSettings.LDAP_USE_BIND_USER:
        with ldap_connection() as bind_conn:
            # Try to make connection with the bind user first
            if not ldap_authenticate(
                bind_conn,
                user_dn=QuerybookSettings.LDAP_BIND_USER,
                password=QuerybookSettings.LDAP_BIND_PASSWORD,
            ):
                raise ConnectionError(
                    "Failed to establish LDAP connection for bind user"
                )

            processed_username, user_dn = get_transformed_username(bind_conn, username)

            with ldap_connection() as user_conn:
                ldap_user_info = authenticate_user_by_bind_connection(
                    user_dn=user_dn,
                    password=password,
                    bind_conn=bind_conn,
                    user_conn=user_conn,
                )
    else:
        with ldap_connection() as user_conn:
            processed_username, user_dn = get_transformed_username(user_conn, username)

            ldap_user_info = authenticate_user_by_direct_connection(
                user_dn=user_dn, password=password, user_conn=user_conn
            )

    with DBSession() as session:
        db_user = login_user(
            username=processed_username,
            email=ldap_user_info.email,
            full_name=ldap_user_info.full_name,
            session=session,
        )
        flask_login.login_user(AuthUser(db_user))
        return db_user


def init_app(app) -> None:
    login_manager.init_app(app)


def login(_) -> None:
    # The webapp will handle the UI for logging in
    pass
