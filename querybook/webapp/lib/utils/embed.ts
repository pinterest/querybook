const EMBED_PATH_STRING = 'embedded';

export const isEmbedPath = (path: string): boolean =>
    path.includes(EMBED_PATH_STRING);
