import { BoardItemType } from 'const/board';

export const BoardDraggableType = 'Board-';
export const DataDocDraggableType = 'DataDoc-';

export interface IProcessedBoardItem {
    id: number;
    key: string;
    icon: string;
    itemUrl: string;
    itemId: number;
    itemType: BoardItemType;
    title: string;
    selected: boolean;
    boardId: number;
}
