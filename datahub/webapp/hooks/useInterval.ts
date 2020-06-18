import { useEffect } from 'react';

export const useInterval = (
    func: () => any,
    freq: number,
    disabled: boolean = false
) => {
    useEffect(() => {
        let interval: number = null;
        if (!disabled) {
            interval = setInterval(func, freq);
        }

        return () => {
            if (interval) {
                clearInterval(interval);
                interval = null;
            }
        };
    }, [disabled, func, freq]);
};
