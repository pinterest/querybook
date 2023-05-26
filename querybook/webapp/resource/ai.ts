import ds from 'lib/datasource';

export const AIResource = {
    generateTitle: (question: string) => {
        const params = { question };
        return ds.fetch<string>(`/ai/generate_title/`, params);
    },
};
