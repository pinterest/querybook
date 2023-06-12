import * as DraftJs from 'draft-js';

import { CellCommentResource, TableCommentResource } from 'resource/comment';

export interface IComment {
    id: number;
    text: DraftJs.ContentState;
    uid: number;
    created_at: number;
    updated_at: number;

    parent_commment_id?: number;
    child_comment_ids?: number[];

    reactions: IReaction[];
}

export interface IReaction {
    id: number;
    reaction: string;
    uid: number;
}

export enum CommentEntityType {
    CELL = 'cell',
    TABLE = 'table',
}

export const commentResourceByEntityType = {
    [CommentEntityType.CELL]: CellCommentResource,
    [CommentEntityType.TABLE]: TableCommentResource,
};

export const commentStateKeyByEntityType = {
    [CommentEntityType.CELL]: 'cellIdToCommentIds',
    [CommentEntityType.TABLE]: 'tableIdToCommentIds',
};
