import { useEffect } from 'react';

export const useWindowEvent = (
    eventName: string,
    func: (...args: any[]) => any,
    useCapture = false
) => {
    useEffect(() => {
        window.addEventListener(eventName, func, useCapture);

        return () => {
            window.removeEventListener(eventName, func, useCapture);
        };
    }, [func, eventName, useCapture]);
};
