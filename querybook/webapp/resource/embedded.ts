import ds from 'lib/datasource';

export const EmbeddedResource = {
    getAllowedOrigins: () =>
        ds.fetch<string[]>(`/utils/embedded/allowed_origins/`),
};
