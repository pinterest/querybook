from flask_login import current_user

from app.datasource import register
from logic import survey as logic


@register("/survey/", methods=["POST"])
def create_survey(
    rating: int, surface: str, surface_metadata: dict[str, str], comment: str = None
):
    return logic.create_survey(
        uid=current_user.id,
        rating=rating,
        surface=surface,
        surface_metadata=surface_metadata,
        comment=comment,
    )


@register("/survey/<int:survey_id>/", methods=["PUT"])
def update_survey(survey_id: int, rating: int = None, comment: str = None):
    return logic.update_survey(
        uid=current_user.id,
        survey_id=survey_id,
        rating=rating,
        comment=comment,
    )
