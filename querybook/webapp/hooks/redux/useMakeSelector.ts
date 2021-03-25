import { DropFirst } from 'lib/typescript';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { IStoreState } from 'redux/store/types';

export function useMakeSelector<
    F extends (state: IStoreState, ...args: any[]) => any
>(
    selectorMaker: () => F,
    ...additionalProps: DropFirst<Parameters<F>>
): ReturnType<F> {
    const selector = useMemo(() => selectorMaker(), []);
    return useSelector((state: IStoreState) =>
        selector(state, ...additionalProps)
    );
}
