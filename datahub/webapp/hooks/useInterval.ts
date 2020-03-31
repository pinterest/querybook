import { useEffect } from 'react';

export const useInterval = (
    func: () => any,
    freq: number,
    disabled: boolean = false
) => {
    useEffect(() => {
        let interval: number = null;
        if (!disabled) {
            // Every 5 mins
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
