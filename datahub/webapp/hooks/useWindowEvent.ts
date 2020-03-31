import { useEffect } from 'react';

export const useWindowEvent = (
    eventName: string,
    func: (...args: any[]) => any
) => {
    useEffect(() => {
        window.addEventListener(eventName, func, true);

        return () => {
            window.removeEventListener(eventName, func, true);
        };
    }, [func, eventName]);
};
