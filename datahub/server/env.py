# DO NOT IMPORT ANY CUSTOM MODULES HERE
import os
import sys


class MissingConfigException(Exception):
    pass


def get_env(name, optional=False, default=None):
    val = os.environ.get(name)

    # We treat empty string as None as well
    if val is None or len(val) == 0:
        if not optional:
            raise MissingConfigException(
                "{} is required to start the process.".format(name)
            )
        return default
    return val


class DataHubSettings(object):
    PRODUCTION = get_env("production", optional=True, default=False) == "true"
    TESTING = get_env(
        "TESTING", optional=True, default=hasattr(sys, "_called_from_test")
    )

    # Security key for flask, which is required to for any encryption with flask
    FLASK_SECRET_KEY = get_env("FLASK_SECRET_KEY", optional=True)

    # Infrastructure
    PUBLIC_URL = get_env("PUBLIC_URL", optional=True, default="")
    REDIS_URL = get_env("REDIS_URL", optional=True)
    ELASTICSEARCH_HOST = get_env("ELASTICSEARCH_HOST", optional=True)
    DATABASE_CONN = get_env("DATABASE_CONN", optional=True)
    EMAILER_CONN = get_env("EMAILER_CONN", optional=True, default="localhost")

    ELASTICSEARCH_CONNECTION_TYPE = get_env(
        "ELASTICSEARCH_CONNECTION_TYPE", optional=True, default="naive"
    )

    # DB Config
    DATABASE_POOL_SIZE = int(get_env("DATABASE_POOL_SIZE", optional=True, default=10))
    DATABASE_POOL_RECYCLE = int(
        get_env("DATABASE_POOL_RECYCLE", optional=True, default=3600)
    )

    AUTH_BACKEND = get_env(
        "AUTH_BACKEND", optional=True, default="app.auth.password_auth"
    )
    is_not_oauth = AUTH_BACKEND != "app.auth.oauth_auth"

    OAUTH_CALLBACK_HOST = get_env(
        "OAUTH_CALLBACK_HOST",
        optional=is_not_oauth or PUBLIC_URL is not None,
        default=PUBLIC_URL,
    )
    OAUTH_CLIENT_ID = get_env("OAUTH_CLIENT_ID", optional=is_not_oauth)
    OAUTH_CLIENT_SECRET = get_env("OAUTH_CLIENT_SECRET", optional=is_not_oauth)
    OAUTH_AUTHORIZATION_URL = get_env("OAUTH_AUTHORIZATION_URL", optional=is_not_oauth)
    OAUTH_TOKEN_URL = get_env("OAUTH_TOKEN_URL", optional=is_not_oauth)
    OAUTH_USER_PROFILE = get_env("OAUTH_USER_PROFILE", optional=is_not_oauth)

    DATAHUB_SLACK_TOKEN = get_env("DATAHUB_SLACK_TOKEN", optional=True)
    DATAHUB_EMAIL_ADDRESS = get_env("DATAHUB_EMAIL_ADDRESS", optional=True)

    RESULT_STORE_TYPE = get_env("RESULT_STORE_TYPE", optional=True, default="db")

    S3_BUCKET_NAME = get_env("S3_BUCKET_NAME", optional=RESULT_STORE_TYPE != "s3")
    S3_PATH_PREFIX = get_env("S3_PATH_PREFIX", optional=True, default="")
    S3_MIN_UPLOAD_CHUNK_SIZE = int(
        get_env("S3_MIN_UPLOAD_CHUNK_SIZE", optional=True, default=10485760)
    )
    S3_MAX_UPLOAD_CHUNK_NUM = int(
        get_env("S3_MAX_UPLOAD_CHUNK_NUM", optional=True, default=10000)
    )
    S3_MAX_READ_SIZE = int(get_env("S3_MAX_READ_SIZE", optional=True, default=131072))
    S3_READ_SIZE = int(get_env("S3_READ_SIZE", optional=True, default=5242880))

    DB_MAX_UPLOAD_SIZE = int(
        get_env("DB_MAX_UPLOAD_SIZE", optional=True, default=5242880)
    )

    LOG_LOCATION = get_env("LOG_LOCATION", optional=True, default=None)
