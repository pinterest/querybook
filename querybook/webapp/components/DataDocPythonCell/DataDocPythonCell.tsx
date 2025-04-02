import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import JsonView from '@uiw/react-json-view';
import React, { useCallback, useEffect, useMemo } from 'react';

import { PythonEditor } from 'components/PythonEditor/PythonEditor';
import { StatementResultTable } from 'components/StatementResultTable/StatementResultTable';
import {
    DataCellUpdateFields,
    IDataCellMeta,
    IDataPythonCellMeta,
} from 'const/datadoc';
import { PythonExecutionStatus, PythonKernelStatus } from 'lib/python/types';
import usePython from 'lib/python/usePython';
import { KeyMap } from 'lib/utils/keyboard';
import { PythonCellResource } from 'resource/pythonCell';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Icon } from 'ui/Icon/Icon';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { AccentText } from 'ui/StyledText/StyledText';

import { PythonCellResultView } from './PythonCellResultView';

import './DataDocPythonCell.scss';

interface IDataDocPythonCellProps {
    docId: number;
    cellId: number;
    meta: IDataPythonCellMeta;
    context: string;
    codeIndexInDoc: number;
    isEditable: boolean;
    onChange: (fields: DataCellUpdateFields) => void;
}

export const DataDocPythonCell = ({
    meta,
    codeIndexInDoc,
    cellId,
    docId,
    context,
    onChange,
}: IDataDocPythonCellProps) => {
    const {
        kernelStatus,
        runPython,
        cancelRun,
        stdout,
        stderr,
        executionStatus,
        executionCount,
        getNamespaceInfo,
    } = usePython({
        docId,
        cellId,
    });

    const [identifiers, setIdentifiers] = React.useState<
        { name: string; type: string }[]
    >([]);
    const isRunning = executionStatus === PythonExecutionStatus.RUNNING;

    const fetchNamespaceIdentifiers = useCallback(async () => {
        const info = await getNamespaceInfo?.(docId);
        if (info) {
            setIdentifiers(info.identifiers);
        }
    }, [docId, getNamespaceInfo, setIdentifiers]);

    const runPythonCode = useCallback(async () => {
        const result = await runPython(context);
        console.log(result);
    }, [runPython, context, docId]);

    const keyBindings = useMemo(
        () => [
            {
                key: KeyMap.codeEditor.runQuery.key,
                run: () => {
                    runPythonCode();
                    return true;
                },
            },
        ],
        [runPythonCode]
    );

    const defaultTitlePlaceholder = useMemo(() => {
        return codeIndexInDoc == null
            ? 'Untitled'
            : `Python #${codeIndexInDoc + 1}`;
    }, [codeIndexInDoc]);

    const updateTitle = useCallback(
        (value: string) => {
            onChange({
                meta: { ...meta, title: value },
            });
        },
        [onChange]
    );

    return (
        <div className="DataDocPythonCell">
            <div className="python-cell-header">
                <AccentText weight="bold" size="med">
                    <div>
                        <ResizableTextArea
                            value={meta.title}
                            onChange={updateTitle}
                            transparent
                            placeholder={defaultTitlePlaceholder}
                            className="cell-title"
                        />
                    </div>
                </AccentText>
                <div className="python-cell-controls">
                    {!isRunning && (
                        <AsyncButton
                            className="run-button"
                            onClick={runPythonCode}
                            icon={<Icon name="Play" fill />}
                            disabled={
                                kernelStatus !== PythonKernelStatus.IDLE &&
                                kernelStatus !== PythonKernelStatus.BUSY
                            }
                            color={'accent'}
                        />
                    )}
                    {isRunning && (
                        <AsyncButton
                            className="run-button"
                            onClick={cancelRun}
                            title="Canel"
                        />
                    )}
                </div>
            </div>
            <PythonEditor
                cellId={cellId}
                executionStatus={executionStatus}
                executionCount={executionCount}
                value={context}
                identifiers={identifiers}
                keyBindings={keyBindings}
                onChange={(value) => {
                    onChange({
                        context: value,
                    });
                }}
                onFocus={fetchNamespaceIdentifiers}
            />
            <PythonCellResultView stdout={stdout} stderr={stderr} />
        </div>
    );
};
