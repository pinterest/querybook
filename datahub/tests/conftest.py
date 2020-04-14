import os
import tempfile
from unittest import mock

import pytest
from sqlalchemy import create_engine


def pytest_configure(config):
    """We can use _called_from_test to disable some checks
       during the test
    """
    import sys

    sys._called_from_test = True


def pytest_unconfigure(config):
    import sys

    del sys._called_from_test


@pytest.fixture
def db_engine(monkeypatch):
    from env import DataHubSettings

    tempfile_path = os.path.join(tempfile.gettempdir(), "test.db")
    database_conn = "sqlite:///" + tempfile_path
    engine = create_engine(
        database_conn, pool_pre_ping=True, encoding="utf-8", echo=True
    )

    import models

    models.Base.metadata.create_all(engine)

    def mock_get_db_engine(**kwargs):
        return engine

    from app import db

    monkeypatch.setattr(db, "get_db_engine", mock_get_db_engine)
    monkeypatch.setattr(DataHubSettings, "DATABASE_CONN", database_conn, raising=True)

    yield engine

    os.remove(tempfile_path)


@pytest.fixture
def flask_client(db_engine):
    from app.flask_app import flask_app

    flask_app.config["TESTING"] = True
    with flask_app.test_client() as client:
        yield client


@pytest.fixture
def fake_user(monkeypatch):
    import flask_login

    user = mock.MagicMock()
    user.__repr__ = lambda self: "Mr Mocked"
    monkeypatch.setattr(flask_login.utils, "_get_user", user)

    return user
