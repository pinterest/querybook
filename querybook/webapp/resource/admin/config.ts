import ds from 'lib/datasource';

export const AdminConfigResource = {
    get: () => ds.fetch<Record<string, unknown>>(`/admin/querybook_config/`),
};
