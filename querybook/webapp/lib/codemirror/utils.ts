import { syntaxTree } from '@codemirror/language';
import { EditorState, EditorView } from '@uiw/react-codemirror';

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
    editorState: EditorState,
    offset: number
): IPosition => {
    const doc = editorState.doc;
    const line = doc.lineAt(offset);
    return { line: line.number - 1, ch: offset - line.from };
};

export const getTokenAtOffset = (
    editorState: EditorState,
    pos: number,
    side?: -1 | 0 | 1
): CodeMirrorToken | null => {
    const tree = syntaxTree(editorState);
    let node = tree.resolveInner(pos, side);

    if (node.name === 'Statement' || node.parent === null) {
        return null;
    }

    // Check if the node is part of a CompositeIdentifier
    if (node.parent && node.parent.name === 'CompositeIdentifier') {
        node = node.parent;
    }

    const to = side === -1 ? pos : node.to;

    return {
        from: node.from,
        to: node.to,
        text: editorState.doc.sliceString(node.from, to),
    };
};
