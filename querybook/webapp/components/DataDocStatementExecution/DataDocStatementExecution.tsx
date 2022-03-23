import React, { useEffect, useMemo } from 'react';

import {
    StatementExecutionStatus,
    IStatementExecution,
    IStatementResult,
} from 'const/queryExecution';

import { useToggleState } from 'hooks/useToggleState';

import { StatementLogWrapper } from './StatementLog';
import { StatementMeta } from './StatementMeta';
import { StatementResult } from './StatementResult';

import { Modal } from 'ui/Modal/Modal';
import { ProgressBar } from 'ui/ProgressBar/ProgressBar';

import './DataDocStatementExecution.scss';
import { sanitizeAndExtraMarkdown } from 'lib/markdown';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    statementExecution: IStatementExecution;
    statementResult: IStatementResult;

    showStatementLogs: boolean;
    showStatementMeta: boolean;

    toggleStatementMeta: () => any;
    loadS3Result: (id: number) => any;
}

function useStatementMeta(
    metaInfo: string | null,
    showStatementMeta: boolean,
    toggleStatementMeta: () => void
) {
    const [statementMeta, forceShowMeta] = useMemo(() => {
        if (!metaInfo) {
            return [null, false];
        }
        const [processedMeta, metaProperties] = sanitizeAndExtraMarkdown(
            metaInfo
        );
        return [processedMeta, Boolean(metaProperties['force_show'])];
    }, [metaInfo]);

    useEffect(() => {
        if (forceShowMeta && !showStatementMeta) {
            toggleStatementMeta();
        }
    }, [forceShowMeta]);

    return statementMeta;
}

export const DataDocStatementExecution: React.FC<IProps> = ({
    statementExecution,
    statementResult,

    showStatementLogs,
    showStatementMeta,
    toggleStatementMeta,

    loadS3Result,
}) => {
    const [showInFullScreen, , toggleFullScreen] = useToggleState(false);
    const statementMeta = useStatementMeta(
        statementExecution.meta_info,
        showStatementMeta,
        toggleStatementMeta
    );

    useEffect(() => {
        if (statementExecution.result_row_count && !statementResult) {
            loadS3Result(statementExecution.id);
        }
    }, [
        statementExecution.result_row_count,
        statementExecution.id,
        statementResult,
    ]);

    const getLogDOM = () => (
        <StatementLogWrapper statementId={statementExecution.id} />
    );

    const getMetaInfoDOM = () => <StatementMeta metaInfo={statementMeta} />;

    const getContentDOM = () => {
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
                        showValue
                        isSmall
                        type="success"
                    />
                </div>
            );
            contentDOM = (
                <div className="statement-execution-text-container">
                    <div className="statement-execution-text-title">
                        Status: {statusLabel}
                    </div>
                    {getMetaInfoDOM()}
                    {progressBar}
                    {getLogDOM()}
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
                    {getMetaInfoDOM()}
                    <div className="flex-row">
                        <Icon name="Loading" className="mr8" />
                        <AccentText color="light" weight="bold">
                            Loading query results
                        </AccentText>
                    </div>
                    {getLogDOM()}
                </div>
            );
        } else if (status === StatementExecutionStatus.DONE) {
            contentDOM = (
                <>
                    {showStatementMeta && getMetaInfoDOM()}
                    {showStatementLogs && getLogDOM()}
                    <StatementResult
                        statementResult={statementResult}
                        statementExecution={statementExecution}
                        onFullscreenToggle={toggleFullScreen}
                        isFullscreen={false}
                    />
                </>
            );
        } else if (status === StatementExecutionStatus.ERROR) {
            // error
            contentDOM = (
                <div>
                    {getMetaInfoDOM()}
                    {getLogDOM()}
                </div>
            );
        } else if (status === StatementExecutionStatus.CANCEL) {
            // cancelled
            contentDOM = (
                <div className="statement-execution-text-container">
                    <div className="statement-execution-text-title">
                        Status: User Cancelled
                    </div>
                    {getMetaInfoDOM()}
                    {getLogDOM()}
                </div>
            );
        }

        return <div className="statement-execution-content">{contentDOM}</div>;
    };

    const getFullScreenModal = () =>
        showInFullScreen ? (
            <Modal type="fullscreen" onHide={toggleFullScreen}>
                <StatementResult
                    statementResult={statementResult}
                    statementExecution={statementExecution}
                    onFullscreenToggle={toggleFullScreen}
                    isFullscreen={true}
                />
            </Modal>
        ) : null;

    return (
        <>
            <div className={'DataDocStatementExecution'}>{getContentDOM()}</div>
            {getFullScreenModal()}
        </>
    );
};
