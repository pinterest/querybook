import JsonView from '@uiw/react-json-view';
import { lightTheme } from '@uiw/react-json-view/light';
import { vscodeTheme } from '@uiw/react-json-view/vscode';
import React, { useCallback, useMemo } from 'react';

import { StatementResultTable } from 'components/StatementResultTable/StatementResultTable';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { PythonOutputType } from 'lib/python/types';
import { IStoreState } from 'redux/store/types';

import './PythonCellResultView.scss';

interface IPythonCellResultViewProps {
    stdout: PythonOutputType[];
    stderr: string;
}

export const PythonCellResultView = ({
    stdout,
    stderr,
}: IPythonCellResultViewProps) => {
    const theme = useShallowSelector(
        (state: IStoreState) => state.user.computedSettings['theme']
    );

    const themeStyle = useMemo(
        () => ({
            ...(theme === 'dark' ? vscodeTheme : lightTheme),
            '--w-rjv-background-color': 'var(--bg-lightest)',
        }),
        [theme]
    );

    const getTableData = useCallback((data) => {
        const columns = data['columns'];
        const records = data['records'];

        return [
            columns,
            ...records.map((record) => columns.map((col) => record[col])),
        ];
    }, []);

    const renderOutput = (output: PythonOutputType) => {
        if (typeof output === 'object') {
            if (output['type'] === 'dataframe') {
                return (
                    <StatementResultTable
                        data={getTableData(output['data'])}
                        paginate={true}
                    />
                );
            } else if (output['type'] === 'image') {
                return <img src={output['data']} className="image-view" />;
            } else if (output['type'] === 'json') {
                return (
                    <div className="json-view">
                        <JsonView
                            value={output['data']}
                            displayDataTypes={false}
                            style={themeStyle}
                        />
                    </div>
                );
            }
        }

        return <div className="text-view">{output}</div>;
    };

    return (
        <div className="PythonCellResultView">
            {!!stdout?.length && (
                <div className="stdout">
                    {stdout.map((output, index) => (
                        <React.Fragment key={index}>
                            {renderOutput(output)}
                        </React.Fragment>
                    ))}
                </div>
            )}
            {!!stderr?.length && <pre className="stderr">{stderr}</pre>}
        </div>
    );
};
