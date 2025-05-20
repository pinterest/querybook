import { python } from '@codemirror/lang-python';
import {
    EditorView,
    KeyBinding,
    Panel,
    ReactCodeMirrorRef,
    showPanel,
} from '@uiw/react-codemirror';
import React, { useCallback, useMemo } from 'react';
import ReactDOM from 'react-dom';

import { CodeEditor } from 'components/CodeEditor/CodeEditor';
import { PythonExecutionStatus, PythonIdentifierInfo } from 'lib/python/types';

import { PythonEditorStatusBar } from './PythonEditorStatusBar';
import { useAutocompletionExtension } from './useAutocompletionExtension';

interface IDataDocPythonCellProps {
    cellId: number;
    value: string;
    executionStatus: PythonExecutionStatus;
    executionCount?: number;
    identifiers?: PythonIdentifierInfo[];
    keyBindings?: KeyBinding[];
    readonly?: boolean;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
}

export const PythonEditor = ({
    cellId,
    value,
    executionStatus = undefined,
    executionCount = undefined,
    identifiers = [],
    keyBindings = [],
    readonly = false,
    onChange,
    onFocus,
    onBlur,
}: IDataDocPythonCellProps) => {
    const editorRef = React.useRef<ReactCodeMirrorRef>();
    const statusBarDomRef = React.useRef<HTMLDivElement>();
    const createStatusBar = useCallback(
        (view: EditorView): Panel => {
            if (!statusBarDomRef.current) {
                statusBarDomRef.current = document.createElement('div');
            }
            ReactDOM.render(
                <PythonEditorStatusBar
                    executionStatus={executionStatus}
                    executionCount={executionCount}
                />,
                statusBarDomRef.current
            );

            return { dom: statusBarDomRef.current };
        },
        [executionStatus, executionCount, statusBarDomRef.current]
    );

    const statusBarExtension = useMemo(
        () => showPanel.of(createStatusBar),
        [createStatusBar]
    );

    const autocompletionExtension = useAutocompletionExtension({
        view: editorRef.current?.view,
        namespaceIdentifiers: identifiers,
    });

    const extensions = useMemo(
        () => [python(), statusBarExtension, autocompletionExtension],
        [statusBarExtension, autocompletionExtension]
    );

    return (
        <div className="PythonEditor">
            <CodeEditor
                value={value}
                cellId={cellId}
                keyBindings={keyBindings}
                onChange={onChange}
                onFocus={onFocus}
                onBlur={onBlur}
                extensions={extensions}
                readonly={readonly}
            />
        </div>
    );
};
