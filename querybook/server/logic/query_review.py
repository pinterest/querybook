import datetime
from app.db import with_session
from logic.query_execution import get_query_execution_by_id
from models.query_review import QueryReview


@with_session
def create_query_review(
    query_author_id: int,
    query_execution_id: int,
    review_request_reason: str = "",
    commit=True,
    session=None,
):
    query_execution = get_query_execution_by_id(query_execution_id, session=session)
    assert (
        query_execution is not None
    ), f"QueryExecution with id {query_execution_id} does not exist."
    assert (
        query_execution.uid == query_author_id
    ), "You are not the author of this query execution."

    query_review = QueryReview.create(
        fields={
            "query_execution_id": query_execution_id,
            "query_author_id": query_author_id,
            "review_request_reason": review_request_reason,
        },
        commit=False,
        session=session,
    )

    if commit:
        session.commit()
    else:
        session.flush()

    session.refresh(query_review)
    return query_review


@with_session
def update_query_review(query_review_id: int, commit=True, session=None, **fields):
    query_review = get_query_review(query_review_id, session=session)

    if not query_review:
        return

    updated = QueryReview.update(
        id=query_review_id,
        fields=fields,
        skip_if_value_none=True,
        commit=False,
        session=session,
    )

    if updated:
        query_review.updated_at = datetime.datetime.now()
        if commit:
            session.commit()
        else:
            session.flush()
        session.refresh(query_review)

    return query_review


@with_session
def get_query_review(query_review_id: int, session=None):
    return QueryReview.get(id=query_review_id, session=session)


@with_session
def get_query_review_from_query_execution_id(query_execution_id: int, session=None):
    query_execution = get_query_execution_by_id(query_execution_id, session=session)
    return query_execution.review if query_execution else None
