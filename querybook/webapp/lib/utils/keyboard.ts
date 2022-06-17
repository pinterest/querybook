import { isOSX } from './os-platform';
import { KeyboardEvent as ReactKeyboardEvent } from 'react';

type AllKeyboardEvent = KeyboardEvent | ReactKeyboardEvent;

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

const SpecialKeyToSymbol = {
    OSX: {
        CMD: '⌘',
        ALT: '⌥',
        ENTER: '⏎',
        SHIFT: '⇧',
        UP: '↑',
        DOWN: '↓',
        BACKSPACE: 'delete',
    },
    Windows: {
        CMD: 'Ctrl',
        ENTER: '⏎',
        SHIFT: '⇧',
        UP: '↑',
        DOWN: '↓',
        BACKSPACE: '←',
    },
};

export function matchKeyPress(
    event: AllKeyboardEvent,
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

export function matchKeyMap(
    event: AllKeyboardEvent | React.KeyboardEvent,
    keyMap: { key: string; name: string }
) {
    return matchKeyPress(event, keyMap.key);
}

export function getKeySymbol(key: string) {
    const upperKey = key.toUpperCase();
    const specialKeyMap = isOSX
        ? SpecialKeyToSymbol.OSX
        : SpecialKeyToSymbol.Windows;

    return upperKey in specialKeyMap ? specialKeyMap[upperKey] : key;
}

export function getShortcutSymbols(keyString: string) {
    return keyString.split('-').map(getKeySymbol).join(' ');
}

export { default as KeyMap } from 'const/keyMap';
