import ds from 'lib/datasource';

export interface IGitHubAuthResponse {
    url: string;
}

export const GitHubResource = {
    connectGithub: () => ds.fetch<IGitHubAuthResponse>('/github/auth/'),
    isAuthenticated: () =>
        ds.fetch<{ is_authenticated: boolean }>('/github/is_authenticated/'),
};
