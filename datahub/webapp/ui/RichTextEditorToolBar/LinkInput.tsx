import React from 'react';

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
                    const enterKeyCode = 13;
                    const exitKeyCode = 27;
                    if (event.keyCode === enterKeyCode) {
                        const inputEl = inputRef.current;
                        const url = inputEl.value;

                        onSubmit(url);
                        onDismiss();
                    } else if (event.keyCode === exitKeyCode) {
                        onDismiss();
                    }
                }}
                autoFocus
            />
        </div>
    );
};
