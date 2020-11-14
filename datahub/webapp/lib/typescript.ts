// This file is to supply any functionality typescript still needs

export type HTMLElementEvent<T extends HTMLElement> = Event & {
    target: T;
    // probably you might want to add the currentTarget as well
    // currentTarget: T;
};

export function getEnumEntries(
    enumDefObjectType: Record<string, unknown>
): Array<[string, string | number]> {
    // Somehow Enum is not the same as Record<string, string | number>
    const enumDef = enumDefObjectType as Record<string, string | number>;
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
