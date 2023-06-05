import * as DraftJs from 'draft-js';

export interface IComment {
    id: number;
    // TODO: clean this
    text: string | DraftJs.ContentState;
    uid: number;
    created_at: number;
    updated_at: number;

    child_comments?: IComment[];

    reactions: IReaction[];
}

export interface IReaction {
    reaction: string;
    uid: number;
}
