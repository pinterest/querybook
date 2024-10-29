from app.db import with_session
from models.github import GitHubLink
from models.datadoc import DataDoc


@with_session
def create_repo_link(
    datadoc_id: int,
    user_id: int,
    directory: str,
    commit=True,
    session=None,
):
    datadoc = DataDoc.get(id=datadoc_id, session=session)
    assert datadoc is not None, f"DataDoc with id {datadoc_id} not found"

    github_link = GitHubLink.get(datadoc_id=datadoc_id, session=session)
    if github_link is None:
        github_link = GitHubLink.create(
            {
                "datadoc_id": datadoc_id,
                "user_id": user_id,
                "directory": directory,
            },
            commit=commit,
            session=session,
        )
    else:
        github_link = GitHubLink.update(
            id=github_link.id,
            fields={"directory": directory},
            commit=commit,
            session=session,
        )
    return github_link


@with_session
def get_repo_link(datadoc_id: int, session=None):
    return GitHubLink.get(datadoc_id=datadoc_id, session=session)


@with_session
def delete_repo_link(datadoc_id: int, session=None):
    github_link = GitHubLink.get(datadoc_id=datadoc_id, session=session)
    assert (
        github_link is not None
    ), f"GitHub link for DataDoc with id {datadoc_id} not found"
    GitHubLink.delete(id=github_link.id, commit=True, session=session)


@with_session
def is_repo_linked(datadoc_id: int, session=None) -> bool:
    github_link = GitHubLink.get(datadoc_id=datadoc_id, session=session)
    return github_link is not None
