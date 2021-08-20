import type {
    BoardItemType,
    IBoard,
    IBoardItem,
    IBoardRaw,
    IBoardUpdatableField,
} from 'const/board';
import ds from 'lib/datasource';

export const BoardResource = {
    getAll: (environmentId: number, filterString: string) =>
        ds.fetch<IBoard[]>('/board/', {
            environment_id: environmentId,
            filter_str: filterString,
        }),

    get: (boardId: number) => ds.fetch<IBoardRaw>(`/board/${boardId}/`),

    create: (
        name: string,
        environmentId: number,
        ownerId: number,
        description: string,
        _public: boolean
    ) =>
        ds.save<IBoardRaw>('/board/', {
            name,
            environment_id: environmentId,
            owner_uid: ownerId,
            description,
            public: _public,
        }),

    update: (boardId: number, fields: IBoardUpdatableField) =>
        ds.update<IBoardRaw>(
            `/board/${boardId}/`,
            fields as Record<string, any>
        ),

    delete: (boardId: number) => ds.delete(`/board/${boardId}/`),

    addItem: (boardId: number, itemType: BoardItemType, itemId: number) =>
        ds.save<IBoardItem>(`/board/${boardId}/${itemType}/${itemId}/`),

    moveItem: (boardId: number, fromIndex: number, toIndex: number) =>
        ds.save<null>(`/board/${boardId}/move/${fromIndex}/${toIndex}/`),

    deleteItem: (boardId: number, itemType: BoardItemType, itemId: number) =>
        ds.delete(`/board/${boardId}/${itemType}/${itemId}/`),

    getItemBoardIds: (envId: number, itemType: BoardItemType, itemId: number) =>
        ds.fetch<number[]>(`/board_item/${itemType}/${itemId}/board/`, {
            environment_id: envId,
        }),
};
