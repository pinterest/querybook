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


def text_to_sql(payload):
    return ai_assistant_ds.text_to_sql.__wrapped__(payload)


TEXT_TO_SQL_PAYLOAD = {
    "query_engine_id": 1,
    "tables": ["db.table"],
    "question": "daily users",
    "original_query": "SELECT 1",
    "request_id": "ai_request_3",
}


def test_text_to_sql_without_revision_calls_generate(emitted, fake_assistant):
    text_to_sql(TEXT_TO_SQL_PAYLOAD)

    fake_assistant.generate_sql_query.assert_called_once()
    assert set(fake_assistant.generate_sql_query.call_args.kwargs) == {
        "query_engine_id",
        "tables",
        "question",
        "original_query",
        "socket",
    }
    fake_assistant.revise_sql_query.assert_not_called()


def test_text_to_sql_with_revision_calls_revise(emitted, fake_assistant):
    text_to_sql(
        {
            **TEXT_TO_SQL_PAYLOAD,
            "proposed_query": "SELECT 2",
            "requested_changes": "group by day",
        }
    )

    fake_assistant.generate_sql_query.assert_not_called()
    kwargs = fake_assistant.revise_sql_query.call_args.kwargs
    assert {k: v for k, v in kwargs.items() if k != "socket"} == {
        "query_engine_id": 1,
        "tables": ["db.table"],
        "question": "daily users",
        "original_query": "SELECT 1",
        "proposed_query": "SELECT 2",
        "requested_changes": "group by day",
    }


@pytest.mark.parametrize(
    "revision",
    [
        {"requested_changes": "group by day"},
        {"requested_changes": "group by day", "proposed_query": ""},
        {"requested_changes": "", "proposed_query": "SELECT 2"},
    ],
)
def test_text_to_sql_rejects_incomplete_revision(emitted, fake_assistant, revision):
    text_to_sql({**TEXT_TO_SQL_PAYLOAD, **revision})

    fake_assistant.revise_sql_query.assert_not_called()
    fake_assistant.generate_sql_query.assert_not_called()
    assert [args[0] for _, args, _ in emitted] == ["error", "close"]
