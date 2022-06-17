import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { setGlobalValue } from 'redux/globalState/action';
import { IStoreState } from 'redux/store/types';

export const useGlobalState = <E>(
    key: string,
    defaultValue: E | null = null
): [E | null, (value: E | null) => void] => {
    const dispatch = useDispatch();
    const value = useSelector((state: IStoreState) => state.globalState[key]);
    const setValue = useCallback(
        (newValue: E | null) => dispatch(setGlobalValue(key, newValue)),
        [key]
    );
    return [value ?? defaultValue, setValue];
};
