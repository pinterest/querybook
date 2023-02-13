import os
from app.server import get_health_check

get_health_check


def test_ping_api(flask_client):
    assert b"pong" == flask_client.get("/ping/").get_data()


def test_ping_deploy_api(flask_client, monkeypatch):
    with monkeypatch.context() as m:
        m.setattr(
            os.path,
            "exists",
            lambda p: True if p == "/tmp/querybook/deploying" else False,
        )
        assert 423 == flask_client.get("/ping/").status_code


def test_four_oh_four(flask_client, fake_user):
    assert 404 == flask_client.get("/ds/some/random/path/").status_code


def test_unauthed_error(flask_client):
    assert 401 == flask_client.get("/ds/some/random/path/").status_code
