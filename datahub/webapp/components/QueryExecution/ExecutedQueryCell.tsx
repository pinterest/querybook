import { TextMarker } from 'codemirror';
import React from 'react';
import { useSelector } from 'react-redux';
import { UnControlled as ReactCodeMirror } from 'react-codemirror2';
import styled from 'styled-components';

import { titleize, getCodeEditorTheme } from 'lib/utils';
import { queryEngineByIdEnvSelector } from 'redux/queryEngine/selector';
import { IStoreState } from 'redux/store/types';
import { IQueryExecution } from 'redux/queryExecutions/types';

import { Loading } from 'ui/Loading/Loading';
import './ExecutedQueryCell.scss';

const EmbeddedCodeMirrorContainer = styled.div`
    .CodeMirror {
        &,
        .CodeMirror-scroll,
        .CodeMirror-sizer {
            height: auto;
            max-height: ${(props) => props.height || '300px'};
        }
        font-size: var(--small-text-size);
    }
`;

export interface IHighlightRange {
    from: number;
    to: number;
    className?: string;
}

interface IProps {
    queryExecution: IQueryExecution;
    highlightRange?: IHighlightRange;
    changeCellContext?: (context: string) => any;

    editorHeight?: string;
}

function codeMirrorScrollToLine(editor: CodeMirror.Editor, line: number) {
    const lineTop = editor.charCoords({ line, ch: 0 }, 'local').top;
    const halfScreen = editor.getScrollerElement().offsetHeight / 2;
    const halfLineHeight = 5;
    editor.scrollTo(null, lineTop - halfScreen + halfLineHeight);
}

export const ExecutedQueryCell: React.FunctionComponent<IProps> = ({
    queryExecution,
    changeCellContext,
    highlightRange,
    editorHeight,
}) => {
    const [editor, setEditor] = React.useState<CodeMirror.Editor>(null);
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const editorTheme = useSelector((state: IStoreState) =>
        getCodeEditorTheme(state.user.computedSettings.theme)
    );

    React.useEffect(() => {
        let markedText: TextMarker;

        if (editor && highlightRange) {
            const doc = editor.getDoc();
            const startPos = doc.posFromIndex(highlightRange.from);
            const endPos = doc.posFromIndex(highlightRange.to);

            markedText = editor.getDoc().markText(startPos, endPos, {
                className: highlightRange.className || `code-highlight`,
            });
            codeMirrorScrollToLine(editor, startPos.line);
        }
        return () => {
            // clear last marked text
            if (markedText) {
                markedText.clear();
            }
        };
    }, [editor, highlightRange?.from, highlightRange?.to]);

    if (!queryExecution) {
        return <Loading />;
    }

    const { query } = queryExecution;
    const queryEngine = queryEngineById[queryExecution.engine_id];

    const codeMirrorOptions = {
        mode: 'text/x-hive', // Temporarily hardcoded
        theme: editorTheme,
        indentWithTabs: false,
        readOnly: true,
        lineNumbers: true,
        lineWrapping: true,
        cursorBlinkRate: -1, // nocursor
    };

    const changeCellContextButton = changeCellContext && (
        <span
            className="query-execution-button"
            aria-label={'Copy and Paste this into the query editor above'}
            data-balloon-pos={'up'}
            key={'replace'}
            onClick={() => {
                changeCellContext(query);
            }}
        >
            Paste in Editor
        </span>
    );

    const headerDOM = (
        <div className="execution-header horizontal-space-between">
            <div>
                <div>{`Engine: ${titleize(queryEngine.name)}`}</div>
            </div>
            <div>{changeCellContextButton}</div>
        </div>
    );

    const codeDOM = (
        <EmbeddedCodeMirrorContainer height={editorHeight}>
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

    return (
        <div className="ExecutedQueryCell">
            {headerDOM}
            {codeDOM}
        </div>
    );
};
