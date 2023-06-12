import type { ContentState } from 'draft-js';

import { IComment, IReaction } from 'const/comment';
import ds from 'lib/datasource';

export const CommentResource = {
    get: (parentCommentId: number) =>
        ds.fetch<IComment[]>(`/comment/${parentCommentId}/thread/`),
    create: (parentCommentId: number, text: ContentState) =>
        ds.save<IComment>(`/comment/${parentCommentId}/thread/`, { text }),
    update: (commentId: number, text: IComment) =>
        ds.update<IComment>(`/comment/${commentId}/`, {
            text,
        }),
    delete: (commentId: number) => ds.delete(`/comment/${commentId}`),
};

export const CellCommentResource = {
    get: (cellId: number) =>
        ds.fetch<IComment[]>(`/data_cell/${cellId}/comment/`),
    create: (cellId: number, text: ContentState) =>
        ds.save<IComment>(`/data_cell/${cellId}/comment/`, { text }),
};

export const TableCommentResource = {
    get: (tableId: number) =>
        ds.fetch<IComment[]>(`/data_table/${tableId}/comment/`),
    create: (tableId: number, text: ContentState) =>
        ds.save<IComment>(`/data_table/${tableId}/comment/`, { text }),
};

export const ReactionResource = {
    get: (commentId: number) =>
        ds.fetch<IReaction[]>(`/comment/${commentId}/reaction/`),
    create: (commentId: number, reaction: string) =>
        ds.save<IReaction>(`/comment/${commentId}/reaction/`, { reaction }),
    delete: (reactionId: number) =>
        ds.delete(`/comment/${reactionId}/reaction/`),
};
