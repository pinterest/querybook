import clsx from 'clsx';
import React, { useMemo } from 'react';

import { formatNumber } from 'lib/utils/number';
import { IStatementExecution, IStatementResult } from 'const/queryExecution';

import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { TextButton } from 'ui/Button/Button';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { StatementResultTable } from '../StatementResultTable/StatementResultTable';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { InfoButton } from 'ui/Button/InfoButton';

interface IProps {
    statementResult: IStatementResult;
    statementExecution: IStatementExecution;
    isFullscreen: boolean;
    onFullscreenToggle: () => any;
}

export const StatementResult: React.FC<IProps> = ({
    statementExecution,
    statementResult,
    isFullscreen,
    onFullscreenToggle,
}) => {
    const getFetchInfoDOM = (
        resultRowMinusColCount: number,
        actualRowMinusColCount: number,
        fetchedAllRows: boolean
    ) => {
        const resultPreviewTooltip = `Use Export to download full result (${formatNumber(
            resultRowMinusColCount,
            'row'
        )})`;

        const fetchRowInfo = fetchedAllRows ? (
            `${formatNumber(actualRowMinusColCount, 'row')} (Full Result)`
        ) : (
            <div className="flex-row">
                <span className="warning-word mr4">Previewing</span>
                <span className="mr4">
                    <PrettyNumber val={actualRowMinusColCount} />
                    <span className="mh4">of</span>
                    <PrettyNumber val={resultRowMinusColCount} unit="row" />
                </span>
                <InfoButton>{resultPreviewTooltip}</InfoButton>
            </div>
        );

        return (
            <span
                className={clsx({
                    'number-of-rows-message': true,
                    'more-rows-than-shown': !fetchedAllRows,
                })}
            >
                {fetchRowInfo}
            </span>
        );
    };

    const { result_row_count: resultRowCount } = statementExecution;

    let fetchRowInfoDOM = null;
    let visualizationDOM = null;

    const exploreButtonDOM = (
        <TextButton
            onClick={onFullscreenToggle}
            icon={isFullscreen ? 'X' : 'Maximize2'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            size="small"
        />
    );

    if (resultRowCount === 0) {
        visualizationDOM = (
            <div className="statement-execution-no-output">No Output</div>
        );
    } else if (!statementResult) {
        visualizationDOM = <Loading />;
    } else {
        const { data, failed, error } = statementResult;
        if (failed) {
            return <StatementResultWithError error={error} />;
        }

        const resultRowMinusColCount = Math.max(resultRowCount - 1, 0);
        const actualRowsMinusColCount = Math.max(data.length - 1, 0);
        const fetchedAllRows =
            resultRowMinusColCount === actualRowsMinusColCount;

        fetchRowInfoDOM = getFetchInfoDOM(
            resultRowMinusColCount,
            actualRowsMinusColCount,
            fetchedAllRows
        );
        visualizationDOM = data.length ? (
            <StatementResultTable
                data={data}
                paginate={!isFullscreen}
                isPreview={!fetchedAllRows}
            />
        ) : null;
    }

    return (
        <div
            className={clsx({
                StatementResult: true,
                fullscreen: isFullscreen,
            })}
        >
            <div className="statement-results-summary horizontal-space-between">
                {fetchRowInfoDOM}
                {exploreButtonDOM}
            </div>
            {visualizationDOM}
        </div>
    );
};

const StatementResultWithError: React.FC<{ error: any }> = ({ error }) => {
    const stringfiedError = useMemo(() => String(error), [error]);
    return (
        <Message
            title="Cannot Load Statement Result"
            message={<ShowMoreText text={stringfiedError} seeLess />}
            type="error"
        />
    );
};
