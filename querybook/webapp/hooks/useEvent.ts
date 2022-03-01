import { useEffect } from 'react';

/**
 * Use this to connect React Components with
 * native HTML events
 *
 * @param eventName
 * @param func
 * @param useCapture Defaults to false
 * @param element Defaults to window
 * @param disabled if True, then eventListener is not added
 */
export const useEvent = (
    eventName: string,
    func: EventListenerOrEventListenerObject,
    useCapture = false,
    element: Element | Document | Window = window,
    disabled = false
) => {
    useEffect(() => {
        if (!disabled) {
            element.addEventListener(eventName, func, useCapture);
        }

        return () => {
            if (!disabled) {
                element.removeEventListener(eventName, func, useCapture);
            }
        };
    }, [func, eventName, useCapture, element, disabled]);
};
