import { KeyBinding, keymap, Prec } from '@uiw/react-codemirror';
import { useCallback, useMemo } from 'react';

import { CodeMirrorKeyMap } from 'lib/codemirror';
import { indentLess, insertTab } from '@codemirror/commands';

export const useKeyMapExtension = ({
    keyMap = {},
    keyBindings = [],
}: {
    keyMap?: CodeMirrorKeyMap;
    keyBindings?: KeyBinding[];
}) => {
    // Transform keys like Cmd-F to Cmd-f as codemirror6 expects
    const transformKey = useCallback((key: string) => {
        const parts = key.split('-');
        const lastPart = parts[parts.length - 1];

        // Check if the last part is a single alphabetical character
        if (/^[a-zA-Z]$/.test(lastPart)) {
            parts[parts.length - 1] = lastPart.toLowerCase();
        }

        return parts.join('-');
    }, []);

    const extensions = useMemo(
        () => [
            Prec.highest(
                keymap.of([
                    ...keyBindings.map(({ key, run }) => ({
                        key: transformKey(key),
                        run,
                    })),
                    ...Object.entries(keyMap).map(([key, value]) => ({
                        key: transformKey(key),
                        run: (view) => {
                            value();
                            return true;
                        },
                    })),
                ])
            ),
            keymap.of([{ key: 'Tab', run: insertTab, shift: indentLess }]),
        ],
        [keyBindings, keyMap, transformKey]
    );

    return extensions;
};
