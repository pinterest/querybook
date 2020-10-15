import classNames from 'classnames';
import React from 'react';

import { formatPlural } from 'lib/utils';
import {
    IStatementExecution,
    IStatementResult,
} from 'redux/queryExecutions/types';

import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { Button } from 'ui/Button/Button';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { StatementResultTable } from './StatementResultTable';

interface IProps {
    statementResult: IStatementResult;
    statementExecution: IStatementExecution;
    isFullscreen: boolean;
    onFullscreenToggle: () => any;
}

export class StatementResult extends React.PureComponent<IProps, {}> {
    public getFetchInfoDOM(resultRowColumnCount, actualRowColumnCount) {
        const resultRowCount = Math.max(resultRowColumnCount - 1, 0);
        const actualRowCount = Math.max(actualRowColumnCount - 1, 0);

        const fetchedAllRows = resultRowCount === actualRowCount;
        const resultPreviewTooltip = `Download full result (${formatPlural(
            resultRowCount,
            'row'
        )}) through Export.`;

        const fetchRowInfo = fetchedAllRows ? (
            `Full Result (${formatPlural(actualRowCount, 'row')})`
        ) : (
            <span>
                <span className="warning-word">
                    Previewing First {formatPlural(actualRowCount, 'row')}{' '}
                </span>
                <span>
                    Full Result (<PrettyNumber val={resultRowCount} /> Rows){' '}
                </span>
                <span aria-label={resultPreviewTooltip} data-balloon-pos={'up'}>
                    <i className="fas fa-info-circle" />
                </span>
            </span>
        );

        return (
            <span
                className={classNames({
                    'number-of-rows-message': true,
                    'more-rows-than-shown': !fetchedAllRows,
                })}
            >
                {fetchRowInfo}
            </span>
        );
    }

    public render() {
        const {
            statementResult,
            statementExecution,
            isFullscreen,
            onFullscreenToggle,
        } = this.props;

        const { result_row_count: resultRowCount } = statementExecution;

        let fetchRowInfoDOM = null;
        let visualizationDOM = null;

        const exploreButtonDOM = (
            <Button
                onClick={onFullscreenToggle}
                icon={isFullscreen ? 'minimize-2' : 'maximize-2'}
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                borderless
                small
                type="inlineText"
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
                return (
                    <Message
                        title="Cannot Load Statement Result"
                        message={error}
                        type="error"
                    />
                );
            }

            fetchRowInfoDOM = this.getFetchInfoDOM(resultRowCount, data.length);
            visualizationDOM = data.length ? (
                <StatementResultTable data={data} paginate={!isFullscreen} />
            ) : null;
        }

        return (
            <div
                className={classNames({
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
    }
}
