from unittest.mock import MagicMock

from lib.ai_assistant.base_ai_assistant import BaseAIAssistant


class FakeAssistant(BaseAIAssistant):
    def _get_token_count(self, ai_command, prompt):
        return 0

    def _get_context_length_by_model(self, model_name):
        return 0

    def _get_llm(self, ai_command, prompt_length):
        return None


def revise(original_query):
    assistant = FakeAssistant()
    assistant._generate_sql_query = MagicMock()
    query_engine = MagicMock()
    socket = MagicMock()
    session = MagicMock()

    assistant._revise_sql_query(
        query_engine=query_engine,
        tables=["db.table"],
        question="daily users",
        original_query=original_query,
        proposed_query="SELECT day, count(*) FROM db.table",
        requested_changes="group by week",
        socket=socket,
        session=session,
    )

    assistant._generate_sql_query.assert_called_once()
    kwargs = assistant._generate_sql_query.call_args.kwargs
    assert kwargs["query_engine"] is query_engine
    assert kwargs["tables"] == ["db.table"]
    assert kwargs["socket"] is socket
    assert kwargs["session"] is session
    return kwargs


def test_default_revision_runs_as_edit_with_cell_query():
    kwargs = revise(original_query="SELECT * FROM db.table")

    assert kwargs["original_query"] == "SELECT day, count(*) FROM db.table"
    question = kwargs["question"]
    assert "group by week" in question
    assert "daily users" in question
    assert "The user's query before any AI edits" in question
    assert "SELECT * FROM db.table" in question


def test_default_revision_without_cell_query():
    question = revise(original_query="")["question"]

    assert "group by week" in question
    assert "daily users" in question
    assert "before any AI edits" not in question
    assert "original query" not in question.lower()
