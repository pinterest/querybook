import React from 'react';

import './StatementExecutionBar.scss';
import {
    QueryExecutionStatus,
    StatementExecutionStatus,
    IStatementExecution,
} from 'const/queryExecution';
import { TextButton } from 'ui/Button/Button';
import { ResultExportDropdown } from './ResultExportDropdown';

interface IProps {
    statementExecution: IStatementExecution;

    queryStatus: number;
    showStatementLogs: boolean;
    showExecutedQuery: boolean;
    showStatementMeta: boolean;

    cancelQueryExecution: () => any;
    toggleShowExecutedQuery: () => any;
    toggleLogs: () => any;
    toggleShowStatementMeta: () => any;
}

export const StatementExecutionBar = React.memo<IProps>(
    ({
        statementExecution,
        toggleLogs,
        showStatementLogs,

        toggleShowStatementMeta,
        showStatementMeta,

        queryStatus,
        cancelQueryExecution,
        toggleShowExecutedQuery,
        showExecutedQuery,
    }) => {
        const getToggleLogsButtonDOM = () => {
            if (!statementExecution) {
                return null;
            }

            const { has_log: hasLog, status } = statementExecution;

            const toggleLogsButton = hasLog &&
                status === StatementExecutionStatus.DONE && (
                    <TextButton
                        size="small"
                        onClick={toggleLogs}
                        icon="List"
                        title={showStatementLogs ? 'Show Result' : 'Show Logs'}
                    />
                );

            return toggleLogsButton;
        };

        const getToggleMetaButtonDOM = () => {
            if (!statementExecution) {
                return null;
            }

            const { meta_info: metaInfo, status } = statementExecution;
            return (
                metaInfo &&
                status === StatementExecutionStatus.DONE && (
                    <TextButton
                        size="small"
                        onClick={toggleShowStatementMeta}
                        icon="Activity"
                        title={showStatementMeta ? 'Hide Meta' : 'Show Meta'}
                    />
                )
            );
        };

        const cancelQueryButton =
            queryStatus === QueryExecutionStatus.RUNNING ? (
                <TextButton
                    size="small"
                    onClick={cancelQueryExecution}
                    icon="X"
                    title="Cancel Query"
                />
            ) : null;

        const showExecutedQueryButton = (
            <TextButton
                onClick={toggleShowExecutedQuery}
                size="small"
                icon="Eye"
                title={showExecutedQuery ? 'Hide Query' : 'Show Query'}
            />
        );

        return (
            <div className={'StatementExecutionBar flex-row'}>
                {showExecutedQueryButton}
                {getToggleLogsButtonDOM()}
                {getToggleMetaButtonDOM()}
                {cancelQueryButton}
                <ResultExportDropdown statementExecution={statementExecution} />
            </div>
        );
    }
);
