import { IAccessRequest } from 'const/accessRequest';
import type {
    BoardItemType,
    IBoardBase,
    IBoardEditor,
    IBoardItemRaw,
    IBoardRaw,
    IBoardUpdatableField,
} from 'const/board';
import ds from 'lib/datasource';

export const BoardResource = {
    getAll: (environmentId: number, filterString: string) =>
        ds.fetch<IBoardBase[]>('/board/', {
            environment_id: environmentId,
            filter_str: filterString,
        }),

    get: (boardId: number, environmentId: number) =>
        ds.fetch<IBoardRaw>(`/board/${boardId}/`, {
            environment_id: environmentId,
        }),

    create: (
        name: string,
        environmentId: number,
        description: string,
        _public: boolean
    ) =>
        ds.save<IBoardRaw>('/board/', {
            name,
            environment_id: environmentId,
            description,
            public: _public,
        }),

    update: (boardId: number, fields: IBoardUpdatableField) =>
        ds.update<IBoardRaw>(
            `/board/${boardId}/`,
            fields as Record<string, any>
        ),

    delete: (boardId: number) => ds.delete(`/board/${boardId}/`),

    updateOwner: (boardId: number, newOwnerId: number) =>
        ds.save<IBoardEditor>(`/board/${boardId}/owner/`, {
            next_owner_id: newOwnerId,
        }),

    addItem: (boardId: number, itemType: BoardItemType, itemId: number) =>
        ds.save<IBoardItemRaw>(`/board/${boardId}/${itemType}/${itemId}/`),

    moveItem: (boardId: number, fromIndex: number, toIndex: number) =>
        ds.save<null>(`/board/${boardId}/move/${fromIndex}/${toIndex}/`),

    deleteItem: (boardId: number, itemType: BoardItemType, itemId: number) =>
        ds.delete(`/board/${boardId}/${itemType}/${itemId}/`),

    getItemBoardIds: (envId: number, itemType: BoardItemType, itemId: number) =>
        ds.fetch<number[]>(`/board_item/${itemType}/${itemId}/board_id/`, {
            environment_id: envId,
        }),

    getItemBoards: (envId: number, itemType: BoardItemType, itemId: number) =>
        ds.fetch<IBoardBase[]>(`/board_item/${itemType}/${itemId}/board/`, {
            environment_id: envId,
        }),

    updateItemFields: (boardItemId: number, fields: Record<string, any>) =>
        ds.update<IBoardItemRaw>(`/board/item/${boardItemId}/`, fields),
};

export const BoardEditorResource = {
    get: (boardId: number) =>
        ds.fetch<IBoardEditor[]>(`/board/${boardId}/editor/`),
    create: (boardId: number, uid: number, read: boolean, write: boolean) =>
        ds.save<IBoardEditor>(`/board/${boardId}/editor/${uid}/`, {
            read,
            write,
        }),

    update: (editorId: number, read: boolean, write: boolean) =>
        ds.update<IBoardEditor>(`/board_editor/${editorId}/`, {
            read,
            write,
        }),

    delete: (editorId: number) => ds.delete(`/board_editor/${editorId}/`),
};

export const BoardAccessRequestResource = {
    get: (boardId: number) =>
        ds.fetch<IAccessRequest[]>(`/board/${boardId}/access_request/`),
    create: (boardId: number) =>
        ds.save<IAccessRequest>(`/board/${boardId}/access_request/`),
    delete: (boardId: number, uid: number) =>
        ds.delete(`/board/${boardId}/access_request/`, {
            uid,
        }),
};
