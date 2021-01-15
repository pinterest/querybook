import { useEffect } from 'react';

/**
 * Use this to connect React Components with
 * native HTML events
 *
 * @param eventName
 * @param func
 * @param useCapture Defaults to false
 * @param element Defaults to window
 */
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
