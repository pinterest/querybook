export interface IDragItem<T = Record<string, unknown>> {
    index: number;
    type: string;
    originalIndex: number;

    itemInfo: T;
}
