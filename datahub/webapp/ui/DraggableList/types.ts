export interface IDragItem<T = {}> {
    index: number;
    type: string;
    originalIndex: number;

    itemInfo: T;
}
