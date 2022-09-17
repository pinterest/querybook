import { TextMarker } from 'codemirror';
import React, { useMemo } from 'react';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { getCodeEditorTheme } from 'lib/utils';
import { IStoreState } from 'redux/store/types';

import { IHighlightRange } from './types';

const EmbeddedCodeMirrorContainer = styled.div`
    .CodeMirror {
        &,
        .CodeMirror-scroll,
        .CodeMirror-sizer {
            height: ${(props) =>
                props.autoHeight ? 'auto' : props.height || '300px'};
            max-height: ${(props) => props.height || '300px'};
        }
        font-size: var(--small-text-size);
        border-radius: var(--border-radius-sm);
    }

    .code-highlight {
        background-color: var(--bg-text-select);
    }
    .code-highlight-red {
        background-color: var(--red-highlight);
    }
    .code-highlight-green {
        background-color: var(--green-highlight);
    }
`;

function codeMirrorScrollToLine(editor: CodeMirror.Editor, line: number) {
    const lineTop = editor.charCoords({ line, ch: 0 }, 'local').top;
    const halfScreen = editor.getScrollerElement().offsetHeight / 2;
    const halfLineHeight = 5;
    editor.scrollTo(null, lineTop - halfScreen + halfLineHeight);
}

interface IProps {
    query: string;
    highlightRanges?: IHighlightRange[];

    maxEditorHeight?: string;
    autoHeight?: boolean;
}

export const CodeHighlightWithMark: React.FC<IProps> = ({
    query,
    highlightRanges = [],
    maxEditorHeight,
    autoHeight = true,
}) => {
    const [editor, setEditor] = React.useState<CodeMirror.Editor>(null);
    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    React.useEffect(() => {
        let markedText: TextMarker;

        if (editor && highlightRanges.length) {
            const doc = editor.getDoc();

            for (const highlightRange of highlightRanges) {
                const startPos = doc.posFromIndex(highlightRange.from);
                const endPos = doc.posFromIndex(highlightRange.to);

                markedText = editor.getDoc().markText(startPos, endPos, {
                    className: highlightRange.className || `code-highlight`,
                });
            }

            const firstStartPos = doc.posFromIndex(highlightRanges[0].from);
            codeMirrorScrollToLine(editor, firstStartPos.line);
        }
        return () => {
            // clear last marked text
            if (markedText) {
                markedText.clear();
            }
        };
    }, [editor, highlightRanges]);

    const codeMirrorOptions = useMemo(
        () => ({
            mode: 'text/x-hive', // Temporarily hardcoded
            theme: editorTheme,
            indentWithTabs: false,
            readOnly: true,
            lineNumbers: true,
            lineWrapping: true,
            cursorBlinkRate: -1, // nocursor
        }),
        [editorTheme]
    );

    return (
        <EmbeddedCodeMirrorContainer
            height={maxEditorHeight}
            autoHeight={autoHeight}
        >
            <ReactCodeMirror
                options={codeMirrorOptions}
                value={query}
                editorDidMount={(newEditor) => {
                    setEditor(newEditor);
                    setTimeout(newEditor.refresh, 50);
                }}
            />
        </EmbeddedCodeMirrorContainer>
    );
};
