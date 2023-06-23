import { ContentState } from 'draft-js';

import { ICommentRaw, IReaction } from 'const/comment';
import ds from 'lib/datasource';
import { convertIfContentStateToHTML } from 'lib/richtext/serialize';

export const CommentResource = {
    get: (parentCommentId: number) =>
        ds.fetch<ICommentRaw[]>(`/comment/${parentCommentId}/thread/`),
    create: (parentCommentId: number, text: ContentState) =>
        ds.save<ICommentRaw>(`/comment/${parentCommentId}/thread/`, {
            text: convertIfContentStateToHTML(text),
        }),
    update: (commentId: number, text: ContentState) =>
        ds.update<ICommentRaw>(`/comment/${commentId}/`, {
            text: convertIfContentStateToHTML(text),
        }),
    softDelete: (commentId: number) =>
        ds.delete<null>(`/comment/${commentId}/`),
};

export const CellCommentResource = {
    get: (cellId: number) =>
        ds.fetch<ICommentRaw[]>(`/data_cell/${cellId}/comment/`),
    create: (cellId: number, text: ContentState) =>
        ds.save<ICommentRaw>(`/data_cell/${cellId}/comment/`, {
            text: convertIfContentStateToHTML(text),
        }),
};

export const TableCommentResource = {
    get: (tableId: number) =>
        ds.fetch<ICommentRaw[]>(`/data_table/${tableId}/comment/`),
    create: (tableId: number, text: ContentState) =>
        ds.save<ICommentRaw>(`/data_table/${tableId}/comment/`, {
            text: convertIfContentStateToHTML(text),
        }),
};

export const ReactionResource = {
    get: (commentId: number) =>
        ds.fetch<IReaction[]>(`/comment/${commentId}/reaction/`),
    create: (commentId: number, reaction: string) =>
        ds.save<IReaction>(`/comment/${commentId}/reaction/`, { reaction }),
    delete: (reactionId: number) =>
        ds.delete(`/comment/${reactionId}/reaction/`),
};
