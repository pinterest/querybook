import { indentLess, indentMore, insertTab } from '@codemirror/commands';
import { indentUnit } from '@codemirror/language';
import { EditorSelection, EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap } from '@uiw/react-codemirror';
import { useMemo } from 'react';

// Insert spaces instead of a real tab to reach the next tab stop
const insertSpacesOnTab =
    (tabSize: number) =>
    ({ state, dispatch }) => {
        const line = state.doc.lineAt(state.selection.main.from);
        const column = state.selection.main.from - line.from;
        const spacesToInsert = tabSize - (column % tabSize);

        let changes = state.changeByRange((range) => ({
            changes: {
                from: range.from,
                to: range.to,
                insert: ' '.repeat(spacesToInsert),
            },
            range: EditorSelection.cursor(range.from + spacesToInsert),
        }));

        dispatch(state.update(changes, { userEvent: 'input' }));
        return true;
    };

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
            extensions.push(
                keymap.of([
                    {
                        key: 'Tab',
                        run: insertTab,
                        shift: indentLess,
                    },
                ])
            );
        } else {
            extensions.push(EditorState.tabSize.of(options.tabSize));
            extensions.push(indentUnit.of(' '.repeat(options.indentUnit)));
            extensions.push(
                keymap.of([
                    {
                        key: 'Tab',
                        run: insertSpacesOnTab(options.tabSize),
                        shift: indentLess,
                    },
                ])
            );
        }

        if (lineWrapping) {
            extensions.push(EditorView.lineWrapping);
        }

        return extensions;
    }, [lineWrapping, options]);

    return extension;
};
