from app.datasource import register
from lib.github_integration.github_integration import get_github_manager
from typing import Dict


@register("/github/auth/", methods=["GET"])
def connect_github() -> Dict[str, str]:
    github_manager = get_github_manager()
    return github_manager.initiate_github_integration()


@register("/github/is_authenticated/", methods=["GET"])
def is_github_authenticated() -> str:
    github_manager = get_github_manager()
    is_authenticated = github_manager.get_github_token() is not None
    return {"is_authenticated": is_authenticated}
