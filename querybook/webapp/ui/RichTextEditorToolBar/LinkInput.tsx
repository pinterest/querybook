import React from 'react';
import { matchKeyMap, KeyMap } from 'lib/utils/keyboard';

export const LinkInput: React.FunctionComponent<{
    onDismiss: () => any;
    onSubmit: (url: string) => any;
}> = ({ onDismiss, onSubmit }) => {
    const inputRef = React.useRef<HTMLInputElement>();
    React.useEffect(() => {
        // This is an hack to get input focus
        // there are 2 issues:
        //    1. the autoFocus prop does not work
        //    2. immediately setting inputRef to focus
        //       does not work. Possibly because it is in
        //       a popover
        setTimeout(() => {
            inputRef.current.focus();
        }, 50);
    }, [inputRef.current]);

    return (
        <div className="toolbar-link-input-wrapper">
            <input
                onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                }}
                ref={inputRef}
                placeholder="Enter url here..."
                onKeyDown={(event) => {
                    if (matchKeyMap(event, KeyMap.overallUI.confirmModal)) {
                        const inputEl = inputRef.current;
                        const url = inputEl.value;

                        onSubmit(url);
                        onDismiss();
                    } else if (
                        matchKeyMap(event, KeyMap.overallUI.closeModal)
                    ) {
                        onDismiss();
                    }
                }}
                autoFocus
            />
        </div>
    );
};
