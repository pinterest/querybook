import { useEffect } from 'react';

export const useEvent = (
    eventName: string,
    func: EventListenerOrEventListenerObject,
    useCapture = false,
    element: Element | Document | Window = window
) => {
    useEffect(() => {
        element.addEventListener(eventName, func, useCapture);

        return () => {
            element.removeEventListener(eventName, func, useCapture);
        };
    }, [func, eventName, useCapture, element]);
};
