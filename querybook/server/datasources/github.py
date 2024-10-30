from app.datasource import register
from lib.github.github import github_manager
from typing import Dict
from logic import github as logic
from flask_login import current_user


@register("/github/auth/", methods=["GET"])
def connect_github() -> Dict[str, str]:
    return github_manager.initiate_github_integration()


@register("/github/is_authenticated/", methods=["GET"])
def is_github_authenticated() -> str:
    is_authenticated = github_manager.get_github_token() is not None
    return {"is_authenticated": is_authenticated}


@register("/github/datadocs/<int:datadoc_id>/link/", methods=["POST"])
def link_datadoc_to_github(
    datadoc_id: int,
    directory: str,
) -> Dict:
    return logic.create_repo_link(
        datadoc_id=datadoc_id, user_id=current_user.id, directory=directory
    )
