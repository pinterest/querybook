// This file is to supply any functionality typescript still needs
export function getEnumEntries<T>(
    enumDefObjectType: Record<string, T>
): Array<[string, T]> {
    // Somehow Enum is not the same as Record<string, string | number>
    const enumDef = enumDefObjectType as Record<string, T>;
    return Object.entries(enumDef).filter(([name]) => isNaN(name as any));
}

export type PickType<T, F> = Pick<
    T,
    {
        [K in keyof T]: T[K] extends F ? K : never;
    }[keyof T]
>;
export type WithOptional<T, K extends keyof T> = Omit<T, K> &
    Partial<Pick<T, K>>;

export type DropFirst<T extends unknown[]> = T extends [any, ...infer U]
    ? U
    : never;

export type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
};

export type Nullable<T> = T | undefined | null;
