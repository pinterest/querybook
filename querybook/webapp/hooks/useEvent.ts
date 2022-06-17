import { useEffect } from 'react';

/**
 * Use this to connect React Components with
 * native HTML events
 *
 * @param eventName
 * @param func
 * @param options.useCapture Defaults to false
 * @param options.element Defaults to window
 * @param options.disabled if True, then eventListener is not added
 */
export const useEvent = (
    eventName: string,
    func: EventListenerOrEventListenerObject,
    options?: {
        useCapture?: boolean;
        element?: Element | Document | Window;
        disabled?: boolean;
    }
) => {
    const {
        useCapture = false,
        element = window,
        disabled = false,
    } = options ?? {};

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
