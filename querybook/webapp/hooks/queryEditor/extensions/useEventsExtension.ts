import * as events from '@uiw/codemirror-extensions-events';
import { useMemo } from 'react';

export const useEventsExtension = ({ onFocus, onBlur }) => {
    const extension = useMemo(
        () =>
            events.content({
                focus: onFocus,
                blur: onBlur,
            }),
        [onFocus, onBlur]
    );

    return extension;
};
