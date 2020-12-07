import sys
import os
import json

from lib.config import get_config_value


in_test = hasattr(sys, "_called_from_test")
site_config = get_config_value("site_config", {})
site_default_config = get_config_value("site_default_config", {})


class MissingConfigException(Exception):
    pass


def get_env_config(name, optional=True):
    found = True
    if name in os.environ:
        val = os.environ.get(name)
    elif name in site_config:
        val = site_config.get(name)
    elif name in site_default_config:
        val = site_default_config.get(name)
        found = val is not None
    else:
        found = False
    # We treat empty string as None as well
    if not found and not optional and not in_test:
        raise MissingConfigException(
            "{} is required to start the process.".format(name)
        )
    return val


class SiteSettings(object):
    # Core
    PRODUCTION = os.environ.get("production", "false") == "true"
    PUBLIC_URL = get_env_config("PUBLIC_URL")
    FLASK_SECRET_KEY = get_env_config("FLASK_SECRET_KEY", optional=False)

    # Celery
    REDIS_URL = get_env_config("REDIS_URL", optional=False)

    # Search
    ELASTICSEARCH_HOST = get_env_config("ELASTICSEARCH_HOST", optional=False)
    ELASTICSEARCH_CONNECTION_TYPE = get_env_config("ELASTICSEARCH_CONNECTION_TYPE")

    # Database
    DATABASE_CONN = get_env_config("DATABASE_CONN", optional=False)
    DATABASE_POOL_SIZE = int(get_env_config("DATABASE_POOL_SIZE"))
    DATABASE_POOL_RECYCLE = int(get_env_config("DATABASE_POOL_RECYCLE"))

    # Communications
    EMAILER_CONN = get_env_config("EMAILER_CONN")
    DATAHUB_SLACK_TOKEN = get_env_config("DATAHUB_SLACK_TOKEN")
    DATAHUB_EMAIL_ADDRESS = get_env_config("DATAHUB_EMAIL_ADDRESS")

    # Authentication
    AUTH_BACKEND = get_env_config("AUTH_BACKEND")
    LOGS_OUT_AFTER = int(get_env_config("LOGS_OUT_AFTER"))

    OAUTH_CLIENT_ID = get_env_config("OAUTH_CLIENT_ID")
    OAUTH_CLIENT_SECRET = get_env_config("OAUTH_CLIENT_SECRET")
    OAUTH_AUTHORIZATION_URL = get_env_config("OAUTH_AUTHORIZATION_URL")
    OAUTH_TOKEN_URL = get_env_config("OAUTH_TOKEN_URL")
    OAUTH_USER_PROFILE = get_env_config("OAUTH_USER_PROFILE")

    LDAP_CONN = get_env_config("LDAP_CONN")
    LDAP_USER_DN = get_env_config("LDAP_USER_DN")

    # Result Store
    RESULT_STORE_TYPE = get_env_config("RESULT_STORE_TYPE")

    STORE_BUCKET_NAME = get_env_config("STORE_BUCKET_NAME")
    STORE_PATH_PREFIX = get_env_config("STORE_PATH_PREFIX")
    STORE_MIN_UPLOAD_CHUNK_SIZE = int(get_env_config("STORE_MIN_UPLOAD_CHUNK_SIZE"))
    STORE_MAX_UPLOAD_CHUNK_NUM = int(get_env_config("STORE_MAX_UPLOAD_CHUNK_NUM"))
    STORE_MAX_READ_SIZE = int(get_env_config("STORE_MAX_READ_SIZE"))
    STORE_READ_SIZE = int(get_env_config("STORE_READ_SIZE"))

    DB_MAX_UPLOAD_SIZE = int(get_env_config("DB_MAX_UPLOAD_SIZE"))

    GOOGLE_CREDS = json.loads(get_env_config("GOOGLE_CREDS") or "null")

    # Logging
    LOG_LOCATION = get_env_config("LOG_LOCATION")
