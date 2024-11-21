import { indentUnit } from '@codemirror/language';
import { EditorView } from '@uiw/react-codemirror';
import { useMemo } from 'react';
import { EditorState, Extension } from '@codemirror/state';

export const useOptionsExtension = ({
    lineWrapping = true,
    options = {},
}: {
    lineWrapping: boolean;
    options: Record<string, any>;
}) => {
    const extension = useMemo(() => {
        const extensions: Extension[] = [];

        if (options.indentWithTabs) {
            extensions.push(indentUnit.of('\t'));
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
