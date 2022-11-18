import { useEffect, useRef } from 'react';

export const useInterval = (
    func: () => any,
    freq: number,
    disabled: boolean = false
) => {
    const savedFunc = useRef(func);

    useEffect(() => {
        savedFunc.current = func;
    }, [func]);

    useEffect(() => {
        let interval: number = null;
        if (!disabled) {
            interval = setInterval(() => savedFunc.current(), freq);
        }

        return () => clearInterval(interval);
    }, [disabled, freq]);
};
