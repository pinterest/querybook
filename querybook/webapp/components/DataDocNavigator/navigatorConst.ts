import type { BoardItemType } from 'const/board';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

export const BoardDraggableType = 'Board-';
export const DataDocDraggableType = 'DataDoc-';

export interface IProcessedBoardItem {
    id: number;
    key: string;
    icon: AllLucideIconNames;
    itemUrl: string;
    itemId: number;
    itemType: BoardItemType;
    title: string;
    selected: boolean;
    boardId: number;
}
