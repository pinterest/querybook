import ds from 'lib/datasource';

export interface IGitHubAuthResponse {
    url: string;
}

export interface ICommitAuthor {
    date: string;
    email: string;
    name: string;
}

export interface ICommitData {
    author: ICommitAuthor;
    message: string;
}

export interface ICommit {
    html_url: string;
    commit: ICommitData;
    sha: string;
}

export const GitHubResource = {
    authorizeGitHub: () => ds.fetch<IGitHubAuthResponse>('/github/auth/'),
    isAuthorized: () =>
        ds.fetch<{ is_authorized: boolean }>('/github/is_authorized/'),
    linkGitHub: (docId: number, directory: string) =>
        ds.save<{ directory: string }>(`/github/datadocs/${docId}/link/`, {
            directory,
        }),
    isGitHubLinked: (docId: number) =>
        ds.fetch<{ linked_directory: string | null }>(
            `/github/datadocs/${docId}/is_linked/`
        ),
    getDirectories: (docId: number) =>
        ds.fetch<{ directories: string[] }>(
            `/github/datadocs/${docId}/directories/`
        ),
    commitDataDoc: (docId: number, commitMessage: string) =>
        ds.save<{ message: string }>(`/github/datadocs/${docId}/commit/`, {
            commit_message: commitMessage,
        }),
    getDataDocVersions: (docId: number, limit: number, offset: number) =>
        ds.fetch<ICommit[]>(`/github/datadocs/${docId}/versions/`, {
            limit,
            offset,
        }),
    compareDataDocVersions: (docId: number, commitSha: string) =>
        ds.fetch<{
            current_content: string;
            commit_content: string;
        }>(`/github/datadocs/${docId}/compare/`, {
            commit_sha: commitSha,
        }),
};
