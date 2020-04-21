import { useEffect } from 'react';

export const useWindowEvent = (
    eventName: string,
    func: EventListenerOrEventListenerObject,
    useCapture = false
) => {
    useEffect(() => {
        window.addEventListener(eventName, func, useCapture);

        return () => {
            window.removeEventListener(eventName, func, useCapture);
        };
    }, [func, eventName, useCapture]);
};
