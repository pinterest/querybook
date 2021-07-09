import React from 'react';

import { IStatementExecution } from 'redux/queryExecutions/types';

import './DataDocStatementExecutionBar.scss';
import {
    QueryExecutionStatus,
    StatementExecutionStatus,
} from 'const/queryExecution';
import { Button, TextButton } from 'ui/Button/Button';
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

export class DataDocStatementExecutionBar extends React.PureComponent<IProps> {
    public getToggleLogsButtonDOM() {
        const {
            statementExecution,
            toggleLogs,
            showStatementLogs,
        } = this.props;

        if (!statementExecution) {
            return null;
        }

        const { has_log: hasLog, status } = statementExecution;

        const toggleLogsButton = hasLog &&
            status === StatementExecutionStatus.DONE && (
                <TextButton
                    size="small"
                    onClick={toggleLogs}
                    icon="list"
                    title={showStatementLogs ? 'Show Result' : 'Show Logs'}
                />
            );

        return toggleLogsButton;
    }

    public getToggleMetaButtonDOM() {
        const {
            toggleShowStatementMeta,
            showStatementMeta,
            statementExecution,
        } = this.props;

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
                    icon="activity"
                    title={showStatementMeta ? 'Hide Meta' : 'Show Meta'}
                />
            )
        );
    }

    public render() {
        const {
            queryStatus,
            statementExecution,
            cancelQueryExecution,
            toggleShowExecutedQuery,
            showExecutedQuery,
        } = this.props;

        const cancelQueryButton =
            queryStatus === QueryExecutionStatus.RUNNING ? (
                <TextButton
                    size="small"
                    onClick={cancelQueryExecution}
                    icon="x"
                    title="Cancel Query"
                />
            ) : null;

        const showExecutedQueryButton = (
            <TextButton
                onClick={toggleShowExecutedQuery}
                size="small"
                icon="eye"
                title={showExecutedQuery ? 'Hide Query' : 'Show Query'}
            />
        );

        const statementExecutionBar = (
            <div className={'DataDocStatementExecutionBar flex-row'}>
                {showExecutedQueryButton}
                {this.getToggleLogsButtonDOM()}
                {this.getToggleMetaButtonDOM()}
                {cancelQueryButton}
                <ResultExportDropdown statementExecution={statementExecution} />
            </div>
        );
        return statementExecutionBar;
    }
}
