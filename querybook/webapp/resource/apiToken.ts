import ds from 'lib/datasource';

export const ApiTokenResource = {
    create: () => ds.save<string>(`/api_access_token/`),
};
