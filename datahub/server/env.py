import sys
import os
from lib.config import get_config_value

in_test = hasattr(sys, "_called_from_test")
datahub_config = get_config_value("datahub_config", {})
default_config = get_config_value("default_config", {})


class MissingConfigException(Exception):
    pass


def get_dh_config(name, optional=True):
    found = True
    if name in os.environ:
        val = os.environ.get(name)
    elif name in datahub_config:
        val = datahub_config.get(name)
    elif name in default_config:
        val = default_config.get(name)
        found = val is not None
    else:
        found = False
    # We treat empty string as None as well
    if not found and not optional and not in_test:
        raise MissingConfigException(
            "{} is required to start the process.".format(name)
        )
    return val


class DataHubSettings(object):
    # Core
    PRODUCTION = os.environ.get("production", "false") == "true"
    PUBLIC_URL = get_dh_config("PUBLIC_URL")
    FLASK_SECRET_KEY = get_dh_config("FLASK_SECRET_KEY", optional=False)

    # Celery
    REDIS_URL = get_dh_config("REDIS_URL", optional=False)

    # Search
    ELASTICSEARCH_HOST = get_dh_config("ELASTICSEARCH_HOST", optional=False)
    ELASTICSEARCH_CONNECTION_TYPE = get_dh_config("ELASTICSEARCH_CONNECTION_TYPE")

    # Database
    DATABASE_CONN = get_dh_config("DATABASE_CONN", optional=False)
    DATABASE_POOL_SIZE = int(get_dh_config("DATABASE_POOL_SIZE"))
    DATABASE_POOL_RECYCLE = int(get_dh_config("DATABASE_POOL_RECYCLE"))

    # Communications
    EMAILER_CONN = get_dh_config("EMAILER_CONN")
    DATAHUB_SLACK_TOKEN = get_dh_config("DATAHUB_SLACK_TOKEN")
    DATAHUB_EMAIL_ADDRESS = get_dh_config("DATAHUB_EMAIL_ADDRESS")

    # Authentication
    AUTH_BACKEND = get_dh_config("AUTH_BACKEND")

    OAUTH_CLIENT_ID = get_dh_config("OAUTH_CLIENT_ID")
    OAUTH_CLIENT_SECRET = get_dh_config("OAUTH_CLIENT_SECRET")
    OAUTH_AUTHORIZATION_URL = get_dh_config("OAUTH_AUTHORIZATION_URL")
    OAUTH_TOKEN_URL = get_dh_config("OAUTH_TOKEN_URL")
    OAUTH_USER_PROFILE = get_dh_config("OAUTH_USER_PROFILE")

    # Result Store
    RESULT_STORE_TYPE = get_dh_config("RESULT_STORE_TYPE")

    S3_BUCKET_NAME = get_dh_config("S3_BUCKET_NAME")
    S3_PATH_PREFIX = get_dh_config("S3_PATH_PREFIX")
    S3_MIN_UPLOAD_CHUNK_SIZE = int(get_dh_config("S3_MIN_UPLOAD_CHUNK_SIZE"))
    S3_MAX_UPLOAD_CHUNK_NUM = int(get_dh_config("S3_MAX_UPLOAD_CHUNK_NUM"))
    S3_MAX_READ_SIZE = int(get_dh_config("S3_MAX_READ_SIZE"))
    S3_READ_SIZE = int(get_dh_config("S3_READ_SIZE"))

    DB_MAX_UPLOAD_SIZE = int(get_dh_config("DB_MAX_UPLOAD_SIZE"))

    # Logging
    LOG_LOCATION = get_dh_config("LOG_LOCATION")
