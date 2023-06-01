import sys
import os
import json

from lib.config import get_config_value


in_test = hasattr(sys, "_called_from_test")
querybook_config = get_config_value("querybook_config", {})
querybook_default_config = get_config_value("querybook_default_config", {})


class MissingConfigException(Exception):
    pass


def get_env_config(name, optional=True):
    found = True
    val = None

    if name in os.environ:
        val = os.environ.get(name)
    elif name in querybook_config:
        val = querybook_config.get(name)
    elif name in querybook_default_config:
        val = querybook_default_config.get(name)
        found = val is not None
    else:
        found = False
    # We treat empty string as None as well
    if not found and not optional and not in_test:
        raise MissingConfigException(
            "{} is required to start the process.".format(name)
        )
    return val


class QuerybookSettings(object):
    # Core
    PRODUCTION = os.environ.get("production", "false") == "true"
    PUBLIC_URL = get_env_config("PUBLIC_URL")
    FLASK_SECRET_KEY = get_env_config("FLASK_SECRET_KEY", optional=False)
    FLASK_CACHE_CONFIG = json.loads(get_env_config("FLASK_CACHE_CONFIG"))
    # Celery
    REDIS_URL = get_env_config("REDIS_URL", optional=False)

    # Search
    ELASTICSEARCH_HOST = get_env_config("ELASTICSEARCH_HOST", optional=False)
    ELASTICSEARCH_CONNECTION_TYPE = get_env_config("ELASTICSEARCH_CONNECTION_TYPE")

    # Lineage
    DATA_LINEAGE_BACKEND = get_env_config("DATA_LINEAGE_BACKEND")

    # Database
    DATABASE_CONN = get_env_config("DATABASE_CONN", optional=False)
    DATABASE_POOL_SIZE = int(get_env_config("DATABASE_POOL_SIZE"))
    DATABASE_POOL_RECYCLE = int(get_env_config("DATABASE_POOL_RECYCLE"))

    # Communications
    EMAILER_CONN = get_env_config("EMAILER_CONN")
    QUERYBOOK_SLACK_TOKEN = get_env_config("QUERYBOOK_SLACK_TOKEN")
    QUERYBOOK_EMAIL_ADDRESS = get_env_config("QUERYBOOK_EMAIL_ADDRESS")

    # Authentication
    AUTH_BACKEND = get_env_config("AUTH_BACKEND")
    LOGS_OUT_AFTER = int(get_env_config("LOGS_OUT_AFTER"))

    OAUTH_CLIENT_ID = get_env_config("OAUTH_CLIENT_ID")
    OAUTH_CLIENT_SECRET = get_env_config("OAUTH_CLIENT_SECRET")
    OAUTH_AUTHORIZATION_URL = get_env_config("OAUTH_AUTHORIZATION_URL")
    OAUTH_TOKEN_URL = get_env_config("OAUTH_TOKEN_URL")
    OAUTH_USER_PROFILE = get_env_config("OAUTH_USER_PROFILE")
    AZURE_TENANT_ID = get_env_config("AZURE_TENANT_ID")

    LDAP_CONN = get_env_config("LDAP_CONN")
    LDAP_USE_TLS = str(get_env_config("LDAP_USE_TLS")).lower() == "true"
    LDAP_USE_BIND_USER = str(get_env_config("LDAP_USE_BIND_USER")).lower() == "true"
    # For direct authentication
    LDAP_USER_DN = get_env_config("LDAP_USER_DN")
    # For searches using bind user
    LDAP_BIND_USER = get_env_config("LDAP_BIND_USER")
    LDAP_BIND_PASSWORD = get_env_config("LDAP_BIND_PASSWORD")
    LDAP_SEARCH = get_env_config("LDAP_SEARCH")
    LDAP_FILTER = get_env_config("LDAP_FILTER")
    LDAP_UID_FIELD = get_env_config("LDAP_UID_FIELD")
    LDAP_EMAIL_FIELD = get_env_config("LDAP_EMAIL_FIELD")
    LDAP_LASTNAME_FIELD = get_env_config("LDAP_LASTNAME_FIELD")
    LDAP_FIRSTNAME_FIELD = get_env_config("LDAP_FIRSTNAME_FIELD")
    LDAP_FULLNAME_FIELD = get_env_config("LDAP_FULLNAME_FIELD")
    # Configuration validation
    if LDAP_CONN is not None:
        if LDAP_USE_BIND_USER:
            if (
                LDAP_BIND_USER is None
                or LDAP_BIND_PASSWORD is None
                or LDAP_SEARCH is None
            ):
                raise ValueError(
                    "LDAP_BIND_USER, LDAP_BIND_PASSWORD and LDAP_SEARCH has to be set when using LDAP bind user connection"
                )
        elif LDAP_USER_DN is None:
            raise ValueError(
                "LDAP_USER_DN has to be set when using direct LDAP connection"
            )

    # Result Store
    RESULT_STORE_TYPE = get_env_config("RESULT_STORE_TYPE")

    STORE_BUCKET_NAME = get_env_config("STORE_BUCKET_NAME")
    STORE_PATH_PREFIX = get_env_config("STORE_PATH_PREFIX")
    STORE_MIN_UPLOAD_CHUNK_SIZE = int(get_env_config("STORE_MIN_UPLOAD_CHUNK_SIZE"))
    STORE_MAX_UPLOAD_CHUNK_NUM = int(get_env_config("STORE_MAX_UPLOAD_CHUNK_NUM"))
    STORE_MAX_READ_SIZE = int(get_env_config("STORE_MAX_READ_SIZE"))
    STORE_READ_SIZE = int(get_env_config("STORE_READ_SIZE"))
    S3_BUCKET_S3V4_ENABLED = get_env_config("S3_BUCKET_S3V4_ENABLED") == "true"
    AWS_REGION = get_env_config("AWS_REGION")

    DB_MAX_UPLOAD_SIZE = int(get_env_config("DB_MAX_UPLOAD_SIZE"))

    GOOGLE_CREDS = json.loads(get_env_config("GOOGLE_CREDS") or "null")

    # Logging
    LOG_LOCATION = get_env_config("LOG_LOCATION")

    # Table Upload (Experimental)
    TABLE_MAX_UPLOAD_SIZE = get_env_config("TABLE_MAX_UPLOAD_SIZE")

    # Event Logging
    EVENT_LOGGER_NAME = get_env_config("EVENT_LOGGER_NAME") or "null"

    # Stats Logging
    STATS_LOGGER_NAME = get_env_config("STATS_LOGGER_NAME") or "null"
