from functools import wraps
from app.datasource import api_assert, register
from clients.github_client import GitHubClient
from env import QuerybookSettings
from lib.github.github import github_manager
from typing import Dict, List, Optional
from lib.github.serializers import serialize_datadoc_to_markdown
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


@register("/github/is_authorized/", methods=["GET"])
def is_github_authorized() -> Dict[str, bool]:
    try:
        github_manager.get_github_token()
        is_authorized = True
    except Exception:
        is_authorized = False
    return {"is_authorized": is_authorized}


@register("/github/datadocs/<int:datadoc_id>/link/", methods=["POST"])
def link_datadoc_to_github(
    datadoc_id: int,
    directory: str,
) -> Dict:
    datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id)
    api_assert(
        datadoc is not None,
        "DataDoc not found",
        status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
    )
    assert_can_write(datadoc_id)
    verify_data_doc_permission(datadoc_id)

    github_link = logic.create_repo_link(
        datadoc_id=datadoc_id, user_id=current_user.id, directory=directory
    )
    return github_link.to_dict()


@register("/github/datadocs/<int:datadoc_id>/is_linked/", methods=["GET"])
def is_datadoc_linked(datadoc_id: int) -> Dict[str, Optional[str]]:
    datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id)
    api_assert(
        datadoc is not None,
        "DataDoc not found",
        status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
    )
    assert_can_read(datadoc_id)
    verify_data_doc_permission(datadoc_id)

    github_link = logic.get_repo_link(datadoc_id)
    return {"linked_directory": github_link.directory if github_link else None}


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
    assert_can_write(datadoc_id)
    verify_data_doc_permission(datadoc_id)
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


@register("/github/datadocs/<int:datadoc_id>/compare/", methods=["GET"])
@with_github_client
def compare_datadoc_versions(
    github_client: GitHubClient, datadoc_id: int, commit_sha: str
) -> Dict:
    """
    Compare the current DataDoc with a specific commit.
    """
    assert_can_read(datadoc_id)
    verify_data_doc_permission(datadoc_id)
    current_datadoc = datadoc_logic.get_data_doc_by_id(datadoc_id)
    api_assert(
        current_datadoc is not None,
        "Current DataDoc not found",
        status_code=RESOURCE_NOT_FOUND_STATUS_CODE,
    )
    current_markdown = serialize_datadoc_to_markdown(
        current_datadoc, exclude_metadata=True
    )

    # Get the DataDoc content at the specified commit and re-serialize with metadata excluded
    commit_datadoc = github_client.get_datadoc_at_commit(commit_sha)
    commit_markdown = serialize_datadoc_to_markdown(
        commit_datadoc, exclude_metadata=True
    )

    return {
        "current_content": current_markdown,
        "commit_content": commit_markdown,
    }
