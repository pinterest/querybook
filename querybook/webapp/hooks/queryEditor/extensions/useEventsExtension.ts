import * as events from '@uiw/codemirror-extensions-events';
import { useMemo } from 'react';

export const useEventsExtension = ({
    onFocus,
    onBlur,
}: {
    onFocus?: () => void;
    onBlur?: () => void;
}) => {
    const extension = useMemo(
        () =>
            events.content({
                focus: (evt) => onFocus?.(),
                blur: (evt) => onBlur?.(),
            }),
        [onFocus, onBlur]
    );

    return extension;
};
