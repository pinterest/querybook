import { syntaxTree } from '@codemirror/language';
import { EditorView } from '@uiw/react-codemirror';

import { IPosition } from 'lib/sql-helper/sql-lexer';

export interface CodeMirrorToken {
    from: number;
    to: number;
    text: string;
}

// convert codemirror v5 position to offset in v6
export const posToOffset = (editorView: EditorView, pos: IPosition): number => {
    const doc = editorView.state.doc;
    return doc.line(pos.line + 1).from + pos.ch;
};

// convert offset in v6 to codemirror v5 position
export const offsetToPos = (
    editorView: EditorView,
    offset: number
): IPosition => {
    const doc = editorView.state.doc;
    const line = doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
};

export const getTokenAtOffset = (
    editorView: EditorView,
    pos: number
): CodeMirrorToken => {
    const tree = syntaxTree(editorView.state);
    const node = tree.resolveInner(pos);

    return {
        from: node.from,
        to: node.to,
        text: editorView.state.doc.sliceString(node.from, node.to),
    };
};
