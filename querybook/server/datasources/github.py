from functools import wraps
from app.datasource import api_assert, register
from app.db import DBSession
from clients.github_client import GitHubClient
from env import QuerybookSettings
from lib.github.github import github_manager
from typing import Dict, List, Optional
from logic import github as logic
from logic import datadoc as datadoc_logic
from const.datasources import RESOURCE_NOT_FOUND_STATUS_CODE
from logic.datadoc_permission import assert_can_read, assert_can_write
from app.auth.permission import verify_data_doc_permission
from flask_login import current_user


def with_github_client(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        datadoc_id = kwargs.get("datadoc_id")
        github_link = logic.get_repo_link(datadoc_id)
        access_token = github_manager.get_github_token()
        github_client = GitHubClient(
            github_link=github_link,
            access_token=access_token,
            repo_name=QuerybookSettings.GITHUB_REPO_NAME,
            branch=QuerybookSettings.GITHUB_BRANCH,
        )
        return f(github_client, *args, **kwargs)

    return decorated_function


@register("/github/auth/", methods=["GET"])
def connect_github() -> Dict[str, str]:
    return github_manager.initiate_github_integration()


@register("/github/is_authenticated/", methods=["GET"])
def is_github_authenticated() -> Dict[str, bool]:
    try:
        github_manager.get_github_token()
        is_authenticated = True
    except Exception:
        is_authenticated = False
    return {"is_authenticated": is_authenticated}


@register("/github/datadocs/<int:datadoc_id>/link/", methods=["POST"])
def link_datadoc_to_github(
    datadoc_id: int,
    directory: str,
) -> Dict:
    with DBSession() as session:
        datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id, session=session)
        api_assert(
            datadoc is not None,
            "DataDoc not found",
            status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
        )
        assert_can_write(datadoc_id, session=session)
        verify_data_doc_permission(datadoc_id, session=session)

        github_link = logic.create_repo_link(
            datadoc_id=datadoc_id, user_id=current_user.id, directory=directory
        )
        return github_link.to_dict()


@register("/github/datadocs/<int:datadoc_id>/unlink/", methods=["DELETE"])
def unlink_datadoc_from_github(datadoc_id: int) -> Dict:
    with DBSession() as session:
        datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id, session=session)
        api_assert(
            datadoc is not None,
            "DataDoc not found",
            status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
        )
        assert_can_write(datadoc_id, session=session)
        verify_data_doc_permission(datadoc_id, session=session)

        logic.delete_repo_link(datadoc_id)
        return {"message": "Repository unlinked successfully"}


@register("/github/datadocs/<int:datadoc_id>/is_linked/", methods=["GET"])
def is_datadoc_linked(datadoc_id: int) -> Dict[str, bool]:
    with DBSession() as session:
        datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id, session=session)
        api_assert(
            datadoc is not None,
            "DataDoc not found",
            status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
        )
        assert_can_read(datadoc_id, session=session)
        verify_data_doc_permission(datadoc_id, session=session)

        is_linked = logic.is_repo_linked(datadoc_id)
        return {"is_linked": is_linked}


@register("/github/datadocs/<int:datadoc_id>/directories/", methods=["GET"])
@with_github_client
def get_github_directories(
    github_client: GitHubClient, datadoc_id: int
) -> Dict[str, List[str]]:
    assert_can_read(datadoc_id)
    verify_data_doc_permission(datadoc_id)
    directories = github_client.get_repo_directories()
    return {"directories": directories}


@register("/github/datadocs/<int:datadoc_id>/commit/", methods=["POST"])
@with_github_client
def commit_datadoc(
    github_client: GitHubClient,
    datadoc_id: int,
    commit_message: Optional[str] = None,
) -> Dict:
    with DBSession() as session:
        assert_can_write(datadoc_id, session=session)
        verify_data_doc_permission(datadoc_id, session=session)
        github_client.commit_datadoc(commit_message=commit_message)
        return {"message": "DataDoc committed successfully"}


@register("/github/datadocs/<int:datadoc_id>/versions/", methods=["GET"])
@with_github_client
def get_datadoc_versions(
    github_client: GitHubClient, datadoc_id: int, limit: int = 5, offset: int = 0
) -> List[Dict]:
    assert_can_read(datadoc_id)
    verify_data_doc_permission(datadoc_id)
    page = offset // limit + 1
    versions = github_client.get_datadoc_versions(page=page)
    return versions
