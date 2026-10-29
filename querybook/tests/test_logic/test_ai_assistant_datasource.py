from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.flask_app import socketio
from const.ai_assistant import AI_ASSISTANT_NAMESPACE
from datasources_socketio import ai_assistant as ai_assistant_ds
from lib.ai_assistant import ai_socket


@pytest.fixture
def emitted(monkeypatch):
    calls = []
    monkeypatch.setattr(ai_socket, "request", SimpleNamespace(sid="sid-1"))
    monkeypatch.setattr(
        socketio,
        "emit",
        lambda event, args, **kwargs: calls.append((event, args, kwargs)),
    )
    return calls


@pytest.fixture
def fake_assistant(monkeypatch):
    assistant = MagicMock()
    monkeypatch.setattr(ai_assistant_ds, "ai_assistant", assistant)
    return assistant


def sql_title(payload):
    return ai_assistant_ds.sql_title.__wrapped__(payload)


def test_events_are_tagged_with_request_id(emitted, fake_assistant):
    def generate(query, socket):
        socket.send_data({"title": "Daily users"})
        socket.close()

    fake_assistant.generate_title_from_query.side_effect = generate

    sql_title({"query": "SELECT 1", "request_id": "ai_request_1"})

    room = {"namespace": AI_ASSISTANT_NAMESPACE, "room": "sid-1"}
    assert emitted == [
        ("sql_title", ("data", {"title": "Daily users"}, "ai_request_1"), room),
        ("sql_title", ("close", None, "ai_request_1"), room),
    ]


def test_failure_sends_error_then_close_on_command_channel(emitted, fake_assistant):
    fake_assistant.generate_title_from_query.side_effect = Exception("LLM timeout")

    sql_title({"query": "SELECT 1", "request_id": "ai_request_2"})

    assert [args for _, args, _ in emitted] == [
        ("error", "LLM timeout", "ai_request_2"),
        ("close", None, "ai_request_2"),
    ]
    assert {event for event, _, _ in emitted} == {"sql_title"}
