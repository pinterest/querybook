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
}: IDataDocPythonCellProps) => {
    const editorRef = React.useRef<ReactCodeMirrorRef>();
    const createStatusBar = useCallback(
        (view: EditorView): Panel => {
            const dom = document.createElement('div');
            ReactDOM.render(
                <PythonEditorStatusBar
                    executionStatus={executionStatus}
                    executionCount={executionCount}
                />,
                dom
            );
            return { dom };
        },
        [executionStatus, executionCount]
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
                extensions={extensions}
                readonly={readonly}
            />
        </div>
    );
};
