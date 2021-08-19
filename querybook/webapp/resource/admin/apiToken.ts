import { IAdminApiAccessToken } from 'const/admin';
import ds from 'lib/datasource';
import { IResource } from '../types';

export const getAllAdminTokens: IResource<IAdminApiAccessToken[]> = () =>
    ds.fetch(`/admin/api_access_tokens/`);

export function toggleAdminTokenEnable(tokenId: number, enabled: boolean) {
    return ds.update(`/admin/api_access_token/${tokenId}/`, {
        enabled,
    });
}
