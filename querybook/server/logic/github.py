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
