import { KeyboardEvent as ReactKeyboardEvent } from 'react';

type AllKeyboardEvent = KeyboardEvent | ReactKeyboardEvent;

export const isOSX = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const specialKeyChecker: Record<string, (e: AllKeyboardEvent) => boolean> = {
    CMD: (event: AllKeyboardEvent) => (isOSX ? event.metaKey : event.ctrlKey),
    CTRL: (event: AllKeyboardEvent) => event.ctrlKey,
    ALT: (event: AllKeyboardEvent) => event.altKey,
    SHIFT: (event: AllKeyboardEvent) => event.shiftKey,

    DELETE: (event: AllKeyboardEvent) => event.keyCode === 8,
    TAB: (event: AllKeyboardEvent) => event.keyCode === 9,
    ENTER: (event: AllKeyboardEvent) => event.keyCode === 13,
    ESC: (event: AllKeyboardEvent) => event.keyCode === 27,

    LEFT: (event: AllKeyboardEvent) => event.keyCode === 37,
    UP: (event: AllKeyboardEvent) => event.keyCode === 38,
    RIGHT: (event: AllKeyboardEvent) => event.keyCode === 39,
    DOWN: (event: AllKeyboardEvent) => event.keyCode === 40,
};

export function matchKeyPress(
    event: AllKeyboardEvent | React.KeyboardEvent,
    ...keyStrings: string[]
): boolean {
    // This function aims to simulate codemirror's key map functionality
    // example keyString are 'CMD-K' 'Ctrl-Shift-Space' 'Ctrl-Alt-M' or 'Ctrl-Alt-Tab'
    // Note that case does not matter
    for (const keyString of keyStrings) {
        const keys = keyString.split('-');
        const match = keys.every((key) => {
            const upperKey = key.toUpperCase();
            if (upperKey in specialKeyChecker) {
                return specialKeyChecker[upperKey](event);
            } else if (upperKey.length === 1) {
                return event.keyCode === upperKey.charCodeAt(0);
            }
            return false;
        });

        if (match) {
            return true;
        }
    }
    return false;
}
