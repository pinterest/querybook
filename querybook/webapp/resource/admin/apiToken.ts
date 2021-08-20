import { IAdminApiAccessToken } from 'const/admin';
import ds from 'lib/datasource';

export const AdminTokenResource = {
    getAll: () => ds.fetch<IAdminApiAccessToken[]>(`/admin/api_access_tokens/`),
    toggleEnabled: (tokenId: number, enabled: boolean) =>
        ds.update<IAdminApiAccessToken>(`/admin/api_access_token/${tokenId}/`, {
            enabled,
        }),
};
