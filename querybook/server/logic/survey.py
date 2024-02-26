import datetime

from app.db import with_session
from models.survey import Survey


@with_session
def create_survey(
    uid: int,
    rating: int,
    surface: str,
    surface_metadata: dict[str, str] = {},
    comment: str = None,
    commit: bool = True,
    session=None,
):
    return Survey.create(
        {
            "uid": uid,
            "rating": rating,
            "surface": surface,
            "surface_metadata": surface_metadata,
            "comment": comment,
        },
        commit=commit,
        session=session,
    )


@with_session
def update_survey(
    uid: int,
    survey_id: int,
    rating: int = None,
    comment: str = None,
    commit: bool = True,
    session=None,
):
    survey = Survey.get(id=survey_id, session=session)
    assert survey.uid == uid, "User does not own this survey"

    return Survey.update(
        id=survey_id,
        fields={
            "rating": rating,
            "comment": comment,
            "updated_at": datetime.datetime.now(),
        },
        skip_if_value_none=True,
        commit=commit,
        session=session,
    )
