import * as DraftJs from 'draft-js';

export interface ICommentBase {
    id: number;
    created_by: number;
    created_at: number;
    updated_at: number;

    parent_commment_id?: number;
    child_comment_ids?: number[];

    reactions: IReaction[];
}

export interface ICommentRaw extends ICommentBase {
    text: string;
}

export interface IComment extends ICommentBase {
    text: DraftJs.ContentState;
}

export interface IReaction {
    id: number;
    reaction: string;
    created_by: number;
}

export enum CommentEntityType {
    CELL = 'cell',
    TABLE = 'table',
}

export const commentStateKeyByEntityType = {
    [CommentEntityType.CELL]: 'cellIdToCommentIds',
    [CommentEntityType.TABLE]: 'tableIdToCommentIds',
};
