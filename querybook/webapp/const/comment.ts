import * as DraftJs from 'draft-js';

export interface IComment {
    id: number;
    text: DraftJs.ContentState;
    uid: number;
    created_at: number;
    updated_at: number;

    child_comments?: IComment[];
    child_comment_count?: number;

    reactions?: IReaction[];
}

export interface IReaction {
    id: number;
    reaction: string;
    uid: number;
}
