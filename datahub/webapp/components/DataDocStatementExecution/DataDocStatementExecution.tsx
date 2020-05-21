import { bind } from 'lodash-decorators';
import React from 'react';

import { StatementExecutionStatus } from 'const/queryExecution';

import {
    IStatementLog,
    IStatementExecution,
    IStatementResult,
} from 'redux/queryExecutions/types';

import { Modal } from 'ui/Modal/Modal';
import { ProgressBar } from 'ui/ProgressBar/ProgressBar';

import { StatementLog, StatementLogWrapper } from './StatementLog';
import { StatementResult } from './StatementResult';

import './DataDocStatementExecution.scss';
import { StatementMeta } from './StatementMeta';

interface IProps {
    statementExecution: IStatementExecution;
    statementResult: IStatementResult;

    index: number;
    showStatementLogs: boolean;
    showStatementMeta: boolean;

    loadS3Result: (id: number) => any;
}

interface IState {
    showInFullScreen: boolean;
}

export class DataDocStatementExecution extends React.PureComponent<
    IProps,
    IState
> {
    constructor(props) {
        super(props);
        this.state = {
            showInFullScreen: false,
        };

        this.loadStatementResult(this.props);
    }

    public componentDidUpdate(prevProps) {
        if (this.props.statementExecution !== prevProps.statementExecution) {
            this.loadStatementResult(this.props);
        }
    }

    public loadStatementResult(props) {
        const { statementExecution, statementResult, loadS3Result } = props;

        if (statementExecution.result_row_count && !statementResult) {
            loadS3Result(statementExecution.id);
        }
    }

    @bind
    public onFullscreenToggle() {
        this.setState({
            showInFullScreen: true,
        });
    }

    public makeLogDOM() {
        return (
            <StatementLogWrapper
                statementId={this.props.statementExecution.id}
            />
        );
    }

    public makeMetaInfoDOM() {
        return (
            <StatementMeta metaInfo={this.props.statementExecution.meta_info} />
        );
    }

    public makeContentDOM() {
        const { statementExecution, statementResult } = this.props;

        const { status } = statementExecution;

        let contentDOM = null;
        if (status === StatementExecutionStatus.INITIALIZED) {
            contentDOM = (
                <span className="statement-status-label">Initializing</span>
            );
        } else if (status === StatementExecutionStatus.RUNNING) {
            const percentComplete = statementExecution.percent_complete;
            const statusLabel =
                status === StatementExecutionStatus.RUNNING ? (
                    <span className="statement-status-label">Running</span>
                ) : null;
            const progressBar = status === StatementExecutionStatus.RUNNING && (
                <div className="statement-execution-progress-wrapper">
                    <ProgressBar
                        value={percentComplete}
                        className={'is-success is-small'}
                    />
                    {`  ${
                        percentComplete != null
                            ? `${Math.round(percentComplete)}%`
                            : 'Unknown'
                    }`}
                </div>
            );
            contentDOM = (
                <div className="statement-execution-text-container">
                    <div className="statement-execution-text-title">
                        Status: {statusLabel}
                    </div>
                    {this.makeMetaInfoDOM()}
                    {progressBar}
                    {this.makeLogDOM()}
                </div>
            );
        } else if (status === StatementExecutionStatus.UPLOADING) {
            contentDOM = (
                <div className="statement-execution-text-container">
                    <div className="statement-execution-text-title">
                        <span className="statement-status-label">
                            Status: Uploading
                        </span>
                    </div>
                    {this.makeMetaInfoDOM()}
                    <span>
                        <i className="fa fa-spinner fa-pulse mr8" />
                        Loading query results...
                    </span>
                    {this.makeLogDOM()}
                </div>
            );
        } else if (status === StatementExecutionStatus.DONE) {
            const { showStatementLogs, showStatementMeta } = this.props;
            contentDOM = (
                <>
                    {showStatementMeta && this.makeMetaInfoDOM()}
                    {showStatementLogs && this.makeLogDOM()}
                    <StatementResult
                        statementResult={statementResult}
                        statementExecution={statementExecution}
                        onFullscreenToggle={this.onFullscreenToggle}
                        isFullscreen={false}
                    />
                </>
            );
        } else if (status === StatementExecutionStatus.ERROR) {
            // error
            contentDOM = (
                <div>
                    {this.makeMetaInfoDOM()}
                    {this.makeLogDOM()}
                </div>
            );
        } else if (status === StatementExecutionStatus.CANCEL) {
            // cancelled
            contentDOM = (
                <div className="statement-execution-text-container">
                    <div className="statement-execution-text-title">
                        Status: User Cancelled
                    </div>
                    {this.makeMetaInfoDOM()}
                    {this.makeLogDOM()}
                </div>
            );
        }

        return <div className="statement-execution-content">{contentDOM}</div>;
    }

    public makeFullScreenModal() {
        const { showInFullScreen } = this.state;

        const { statementExecution, statementResult } = this.props;
        return showInFullScreen ? (
            <Modal
                type="fullscreen"
                onHide={() => this.setState({ showInFullScreen: false })}
            >
                <StatementResult
                    statementResult={statementResult}
                    statementExecution={statementExecution}
                    onFullscreenToggle={() =>
                        this.setState({ showInFullScreen: false })
                    }
                    isFullscreen={true}
                />
            </Modal>
        ) : null;
    }

    public render() {
        const contentDOM = this.makeContentDOM();
        // const headerDOM = this.makeHeaderDOM();
        // const footerDOM = this.makeFooterDOM();

        return (
            <>
                <div className={'DataDocStatementExecution'}>
                    {/* {headerDOM} */}
                    {contentDOM}
                </div>
                {this.makeFullScreenModal()}
            </>
        );
    }
}
