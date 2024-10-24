from flask import session as flask_session
from github import Github, GithubException, Auth
from typing import List, Dict, Optional

from lib.github_integration.serializers import (
    deserialize_datadoc_from_markdown,
    serialize_datadoc_to_markdown,
)
from lib.logger import get_logger
from models.datadoc import DataDoc
from models.github import GitHubLink
from env import QuerybookSettings

LOG = get_logger(__name__)


class GitHubClient:
    def __init__(self, github_link: GitHubLink):
        """
        Initialize the GitHub client with an access token from the session.
        Raises an exception if the token is not found.
        """
        self.github_link = github_link
        self.datadoc = github_link.datadoc
        access_token = self._get_access_token()
        auth = Auth.Token(access_token)
        self.client = Github(auth=auth, per_page=5)
        self.user = self.client.get_user()
        self.repo = self._get_repository()
        self.branch = "main"
        self.file_path = self._build_file_path()

    def _get_access_token(self) -> str:
        access_token = flask_session.get("github_access_token")
        if not access_token:
            LOG.error("GitHub OAuth token not found in session")
            raise Exception("GitHub OAuth token not found in session")
        return access_token

    def _get_repository(self):
        repo_url = QuerybookSettings.GITHUB_REPO_URL
        if not repo_url:
            LOG.error("GITHUB_REPO_URL is not configured")
            raise Exception("GITHUB_REPO_URL is not configured")
        repo_full_name = self._extract_repo_full_name(repo_url)
        return self.client.get_repo(repo_full_name)

    @staticmethod
    def _extract_repo_full_name(repo_url: str) -> str:
        # Assumes repo_url is in the format 'https://github.com/owner/repo'
        parts = repo_url.rstrip("/").split("/")
        if len(parts) >= 2:
            return f"{parts[-2]}/{parts[-1]}"
        else:
            raise ValueError("Invalid GITHUB_REPO_URL configuration")

    def _build_file_path(self) -> str:
        directory = self.github_link.directory
        file_name = f"datadoc_{self.datadoc.id}.md"
        return f"{directory}/{file_name}"

    def commit_datadoc(self, commit_message: Optional[str] = None):
        """
        Commit a DataDoc to the repository.
        Args:
            commit_message (Optional[str]): Commit message. Defaults to a standard message.
        Raises:
            Exception: If committing the DataDoc fails.
        """
        content = serialize_datadoc_to_markdown(self.datadoc)
        if not commit_message:
            commit_message = (
                f"Update DataDoc {self.datadoc.id}: {self.datadoc.title or 'Untitled'}"
            )

        try:
            contents = self.repo.get_contents(self.file_path, ref=self.branch)
            # Update file
            self.repo.update_file(
                path=contents.path,
                message=commit_message,
                content=content,
                sha=contents.sha,
                branch=self.branch,
            )
            LOG.info(f"Updated file {self.file_path} in repository.")
        except GithubException as e:
            if e.status == 404:
                # Create new file
                self.repo.create_file(
                    path=self.file_path,
                    message=commit_message,
                    content=content,
                    branch=self.branch,
                )
                LOG.info(f"Created file {self.file_path} in repository.")
            else:
                LOG.error(f"GitHubException during commit: {e}")
                raise Exception(f"Failed to commit DataDoc: {e}")

    def get_datadoc_versions(self, page: int = 1) -> List[Dict]:
        """
        Get the versions of a DataDoc with pagination.
        Args:
            page (int): Page number.
        Returns:
            List[Dict]: A list of commit dictionaries.
        """
        try:
            commits = self.repo.get_commits(
                path=self.file_path,
                sha=self.branch,
            ).get_page(page - 1)
            return [commit.raw_data for commit in commits]
        except GithubException as e:
            LOG.error(f"GitHubException during get_datadoc_versions: {e}")
            return []

    def get_datadoc_at_commit(self, commit_sha: str) -> DataDoc:
        """
        Get a DataDoc at a specific commit.
        Args:
            commit_sha (str): The commit SHA.
        Returns:
            DataDoc: The DataDoc object at the specified commit.
        Raises:
            Exception: If getting the DataDoc at the commit fails.
        """
        try:
            file_contents = self.repo.get_contents(path=self.file_path, ref=commit_sha)
            content = file_contents.decoded_content.decode("utf-8")
            return deserialize_datadoc_from_markdown(content)
        except GithubException as e:
            LOG.error(f"GitHubException during get_datadoc_at_commit: {e}")
            raise Exception(f"Failed to get DataDoc at commit {commit_sha}: {e}")

    def get_repo_directories(self) -> List[str]:
        """
        Get all directories in the repository.
        Returns:
            List[str]: A list of directory names.
        """
        try:
            contents = self.repo.get_contents("")
            directories = [
                content.path for content in contents if content.type == "dir"
            ]
            return directories
        except GithubException as e:
            LOG.error(f"GitHubException during get_directories: {e}")
            return []
