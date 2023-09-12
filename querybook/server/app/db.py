import os
from contextlib import contextmanager
import functools

from flask import has_request_context, g
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError, DisconnectionError
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, scoped_session

from lib.stats_logger import SQL_SESSION_FAILURES, stats_logger

try:
    from greenlet import getcurrent as _get_ident
except ImportError:
    from threading import get_ident as _get_ident


from env import QuerybookSettings
from lib.logger import get_logger

LOG = get_logger(__file__)

__engine = None
__session = None


def get_db_engine(
    conn_string=QuerybookSettings.DATABASE_CONN,
    pool_size=QuerybookSettings.DATABASE_POOL_SIZE,
    pool_recycle=QuerybookSettings.DATABASE_POOL_RECYCLE,
):
    global __engine
    if not __engine:
        """Returns the engine, Session, Base and with_session decorator
        for the given db configuration.
        """
        __engine = create_engine(
            conn_string,
            pool_size=pool_size,
            pool_recycle=pool_recycle,
            pool_pre_ping=True,
            encoding="utf-8",
        )

        """This is to ensure pooled connections are not used in multi-processing.
           Primarily to ensure forked celery worker does not reuse the same connection.

           See https://docs.sqlalchemy.org/en/13/core/pooling.html#using-connection-pools-with-multiprocessing
           for more details.
        """

        @event.listens_for(__engine, "connect")
        def connect(dbapi_connection, connection_record):
            connection_record.info["pid"] = os.getpid()

            if conn_string.startswith("sqlite"):
                # Sqlite DB requires foreign keys to be turned on manually
                # to ensure on delete cascade works
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

        @event.listens_for(__engine, "checkout")
        def checkout(dbapi_connection, connection_record, connection_proxy):
            pid = os.getpid()
            if connection_record.info["pid"] != pid:
                connection_record.connection = connection_proxy.connection = None
                raise DisconnectionError(
                    "Connection record belongs to pid %s, "
                    "attempting to check out in pid %s"
                    % (connection_record.info["pid"], pid)
                )

        if conn_string.startswith("mysql"):
            # Set mode to traditional so that, among other things,
            # inserting data in a column that doesn't fit throws an error.
            __engine.execute("SET SESSION sql_mode='TRADITIONAL'")
    return __engine


def get_session(scopefunc=None):
    """Create a global bound scoped_session

    Returns:
        [type] -- [description]
    """
    global __session
    if not __session:
        __session = scoped_session(
            sessionmaker(bind=get_db_engine()), scopefunc=scopefunc
        )
    return __session


def get_flask_db_session():
    if "database_session" not in g:
        g.database_session = get_session(scopefunc=_get_ident)()
    return g.database_session


def with_session(fn):
    """Decorator for handling sessions."""

    @functools.wraps(fn)
    def func(*args, **kwargs):
        session = None
        # If there's no session, create a new one. We will
        # automatically close this after the function is called.
        if not kwargs.get("session"):
            # By default we try to use global flask db session first
            if has_request_context():
                kwargs["session"] = get_flask_db_session()
            else:  # If not in a flask context then create our own session
                session = get_session()()
                kwargs["session"] = session

        if session is not None:
            try:
                return fn(*args, **kwargs)
            except SQLAlchemyError as e:
                session.rollback()
                # TODO: Log the sqlalchemy error?
                import traceback

                LOG.error(traceback.format_exc())

                # increment sql session failure counter
                stats_logger.incr(SQL_SESSION_FAILURES)

                raise e
            finally:
                # Since we created the session, close it.
                get_session().remove()
        else:
            return fn(*args, **kwargs)

    return func


@contextmanager
def DBSession():
    # If inside a flask request
    # return the flask db session
    if has_request_context():
        yield get_flask_db_session()
        return

    # Otherwise create the session as normal
    # and teardown at the end
    session = get_session()()
    try:
        yield session
    except SQLAlchemyError as e:
        session.rollback()
        # TODO: Log the sqlalchemy error?
        import traceback

        LOG.error(traceback.format_exc())

        # increment sql session failure counter
        stats_logger.incr(SQL_SESSION_FAILURES)

        raise e
    finally:
        get_session().remove()


Base = declarative_base()
