import { shallowEqual, useSelector } from 'react-redux';

import { IStoreState } from 'redux/store/types';

/**
 * Use this instead of useSelect ONLY IF the select would produce
 * a new object or array and not via Reselect.
 *
 * The shallow comparsion would prevent a React state update
 * via shallow comparsion instead of ===.
 *
 * Examples to use useShallowSelect
 * - useShallowSelect((state) => ({ a: state.a, b: state.b }))
 * - useShallowSelect((state) => [...state.a, ...state.b])
 *
 * Examples to NOT use useShallowSelect
 * - useSelect((state) => state.a)
 * - useSelect(reselectSelector)
 *
 * @param selector The same selector you would put in useSelect
 */
export function useShallowSelector<
    F extends (state: IStoreState, ...args: any[]) => any
>(selector: F): ReturnType<F> {
    return useSelector(selector, shallowEqual);
}
