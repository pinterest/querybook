from contextlib import contextmanager
import functools

from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session

from env import DataHubSettings
from lib.logger import get_logger

LOG = get_logger(__file__)

__engine = None
__session = None


def get_db_engine(
    conn_string=DataHubSettings.DATABASE_CONN,
    pool_size=DataHubSettings.DATABASE_POOL_SIZE,
    pool_recycle=DataHubSettings.DATABASE_POOL_RECYCLE,
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

        # Set mode to traditional so that, among other things,
        # inserting data in a column that doesn't fit throws an error.
        __engine.execute("SET SESSION sql_mode='TRADITIONAL'")
    return __engine


def get_session():
    global __session
    if not __session:
        __session = scoped_session(sessionmaker(bind=get_db_engine()))
    return __session


def with_session(fn):
    """Decorator for handling sessions."""

    @functools.wraps(fn)
    def func(*args, **kwargs):
        session = None
        # If there's no session, create a new one. We will
        # automatically close this after the function is called.
        if not kwargs.get("session"):
            session = get_session()()
            kwargs["session"] = session

        try:
            return fn(*args, **kwargs)
        except SQLAlchemyError as e:
            if session:
                session.rollback()

                # TODO: Log the sqlalchemy error?
                import traceback

                LOG.error(traceback.format_exc())
            else:
                raise e
        finally:
            # If we created the session, close it.
            if session:
                get_session().remove()

    return func


@contextmanager
def DBSession():
    """SQLAlchemy database connection"""
    session = get_session()()
    try:
        yield session
    except SQLAlchemyError:
        session.rollback()

        # TODO: Log the sqlalchemy error?
        import traceback

        LOG.error(traceback.format_exc())
    finally:
        get_session().remove()


Base = declarative_base()
