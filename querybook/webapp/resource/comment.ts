import type { ContentState } from 'draft-js';

import { IComment, IReaction } from 'const/comment';
import ds from 'lib/datasource';

export const CommentResource = {
    create_thread: (parentCommentId: number, text: ContentState) =>
        ds.save<IComment>(`/comment/thread/${parentCommentId}/`, { text }),
    update: (commentId: number, text: IComment) =>
        ds.update<IComment>(`/comment/${commentId}/`, {
            text,
        }),
    delete: (commentId: number) => ds.delete(`/comment/${commentId}`),
};

export const CellCommentResource = {
    get: (cellId: number) =>
        ds.fetch<IComment[]>(`/comment/data_cell/${cellId}/`),
    create: (cellId: number, text: ContentState) =>
        ds.save<IComment>(`/comment/data_cell/${cellId}/`, { text }),
};

export const TableCommentResource = {
    get: (tableId: number) =>
        ds.fetch<IComment[]>(`/comment/data_table/${tableId}/`),
    create: (tableId: number, text: ContentState) =>
        ds.save<IComment>(`/comment/data_table/${tableId}/`, { text }),
};

export const ReactionResource = {
    create: (commentId: number, reaction: string) =>
        ds.save<IReaction>(`/comment/${commentId}/reaction/`, { reaction }),
    delete: (reactionId: number) =>
        ds.delete(`/comment/${reactionId}/reaction/`),
};
