import { indentWithTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorState, EditorView, keymap } from '@uiw/react-codemirror';
import { useMemo } from 'react';

export const useOptionsExtension = ({
    lineWrapping = true,
    options = {},
}: {
    lineWrapping: boolean;
    options: Record<string, any>;
}) => {
    const extension = useMemo(() => {
        const extensions = [];

        if (options.indentWithTabs) {
            extensions.push(indentUnit.of('\t'));
            extensions.push(keymap.of([indentWithTab]));
            extensions.push(EditorState.tabSize.of(options.tabSize));
        } else {
            extensions.push(indentUnit.of(' '.repeat(options.indentUnit)));
        }

        if (lineWrapping) {
            extensions.push(EditorView.lineWrapping);
        }

        return extensions;
    }, [lineWrapping, options]);

    return extension;
};
