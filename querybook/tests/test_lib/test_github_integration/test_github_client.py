import pytest
from unittest.mock import MagicMock
from clients.github_client import GitHubClient
from models.datadoc import DataDoc
from models.github import GitHubLink
from github import GithubException


@pytest.fixture
def mock_github(monkeypatch):
    mock_github = MagicMock()
    monkeypatch.setattr("clients.github_client.Github", mock_github)
    return mock_github


@pytest.fixture
def mock_github_link():
    datadoc = DataDoc(id=1, title="Test Doc", cells=[])
    return GitHubLink(
        datadoc=datadoc,
        user_id=1,
        directory="datadocs",
    )


@pytest.fixture
def mock_repo():
    return MagicMock()


def test_initialization(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    assert client.client is not None
    assert client.user is not None
    assert client.repo is not None


def test_commit_datadoc_update(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    mock_repo.get_contents.return_value = MagicMock(sha="fake_sha")
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    client.commit_datadoc()
    mock_repo.update_file.assert_called_once()

    with pytest.raises(Exception) as excinfo:
        client = GitHubClient(
            access_token="fake_token", repo_name=repo_name, branch=branch
        )
        client.commit_datadoc()
    assert "GitHub link is required for this operation" in str(excinfo.value)


def test_commit_datadoc_create(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    mock_repo.get_contents.side_effect = GithubException(404, "Not Found", None)
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    client.commit_datadoc()
    mock_repo.create_file.assert_called_once()

    with pytest.raises(Exception) as excinfo:
        client = GitHubClient(
            access_token="fake_token", repo_name=repo_name, branch=branch
        )
        client.commit_datadoc()
    assert "GitHub link is required for this operation" in str(excinfo.value)


def test_get_datadoc_versions(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    mock_commit = MagicMock()
    mock_commit.raw_data = {"sha": "123"}
    mock_commits = MagicMock()
    mock_commits.get_page.return_value = [mock_commit]
    mock_repo.get_commits.return_value = mock_commits
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    versions = client.get_datadoc_versions()
    assert len(versions) == 1
    assert versions[0]["sha"] == "123"

    with pytest.raises(Exception) as excinfo:
        client = GitHubClient(
            access_token="fake_token", repo_name=repo_name, branch=branch
        )
        client.get_datadoc_versions()
    assert "GitHub link is required for this operation" in str(excinfo.value)


def test_get_repo_directories(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    mock_directory = MagicMock()
    mock_directory.type = "dir"
    mock_directory.path = "datadocs"
    mock_repo.get_contents.return_value = [mock_directory]
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    directories = client.get_repo_directories()
    assert len(directories) == 1
    assert directories[0] == "datadocs"


def test_get_datadoc_at_commit(mock_github, mock_github_link, mock_repo):
    access_token = "fake_token"
    repo_name = "test_repo"
    branch = "main"
    mock_github_instance = mock_github.return_value
    mock_github_instance.get_repo.return_value = mock_repo
    mock_file_contents = MagicMock()
    mock_file_contents.decoded_content = (
        b"---\nid: 1\ntitle: DataDoc\n---\n\n"
        b"<!--\nid: 1\ncell_type: text\ncreated_at: 2023-01-01T00:00:00Z\n"
        b"updated_at: 2023-01-01T00:00:00Z\nmeta: {}\n-->\n"
        b"## Text\n\nContent\n"
    )
    mock_repo.get_contents.return_value = mock_file_contents
    client = GitHubClient(
        access_token=access_token,
        repo_name=repo_name,
        branch=branch,
        github_link=mock_github_link,
    )
    datadoc = client.get_datadoc_at_commit(commit_sha="fake_sha")
    assert datadoc.title == "DataDoc"
    assert datadoc.id == 1
    assert datadoc.cells[0].context == "Content"

    with pytest.raises(Exception) as excinfo:
        client = GitHubClient(
            access_token="fake_token", repo_name=repo_name, branch=branch
        )
        client.get_datadoc_at_commit(commit_sha="fake_sha")
    assert "GitHub link is required for this operation" in str(excinfo.value)
