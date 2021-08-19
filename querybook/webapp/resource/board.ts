import {
    BoardItemType,
    IBoard,
    IBoardItem,
    IBoardRaw,
    IBoardUpdatableField,
} from 'const/board';
import ds from 'lib/datasource';

export function getBoards(environmentId: number, filterString: string) {
    return ds.fetch<IBoard[]>('/board/', {
        environment_id: environmentId,
        filter_str: filterString,
    });
}

export function getBoard(boardId: number) {
    return ds.fetch<IBoardRaw>(`/board/${boardId}/`);
}

export function createBoard(
    name: string,
    environmentId: number,
    ownerId: number,
    description: string,
    _public: boolean
) {
    return ds.save<IBoardRaw>('/board/', {
        name,
        environment_id: environmentId,
        owner_uid: ownerId,
        description,
        public: _public,
    });
}

export function updateBoard(boardId: number, fields: IBoardUpdatableField) {
    return ds.update<IBoardRaw>(
        `/board/${boardId}/`,
        fields as Record<string, any>
    );
}

export function deleteBoard(boardId: number) {
    return ds.delete(`/board/${boardId}/`);
}

export function addBoardItem(
    boardId: number,
    itemType: BoardItemType,
    itemId: number
) {
    return ds.save<IBoardItem>(`/board/${boardId}/${itemType}/${itemId}/`);
}

export function moveBoardItem(
    boardId: number,
    fromIndex: number,
    toIndex: number
) {
    return ds.save<null>(`/board/${boardId}/move/${fromIndex}/${toIndex}/`);
}

export function deleteBoardItem(
    boardId: number,
    itemType: BoardItemType,
    itemId: number
) {
    return ds.delete(`/board/${boardId}/${itemType}/${itemId}/`);
}
