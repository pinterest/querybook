import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    IStatementExecution,
    StatementExecutionStatus,
} from 'const/queryExecution';
import { StatementExecutionDefaultResultSize } from 'const/queryResultLimit';
import { useToggleState } from 'hooks/useToggleState';
import { sanitizeAndExtraMarkdown } from 'lib/markdown';
import { fetchResult } from 'redux/queryExecutions/action';
import { IStoreState } from 'redux/store/types';
import { Icon } from 'ui/Icon/Icon';
import { Modal } from 'ui/Modal/Modal';
import { ProgressBar } from 'ui/ProgressBar/ProgressBar';
import { AccentText } from 'ui/StyledText/StyledText';

import { StatementLogWrapper } from './StatementLog';
import { StatementMeta } from './StatementMeta';
import { StatementResult } from './StatementResult';

import './DataDocStatementExecution.scss';

interface IProps {
    statementExecution: IStatementExecution;

    showStatementLogs: boolean;
    showStatementMeta: boolean;

    toggleStatementMeta: () => any;

    queryExecutionId: number;
}

function useStatementResult(statementExecution: IStatementExecution) {
    const dispatch = useDispatch();
    const statementResult = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.statementResultById[statementExecution.id]
    );
    const isFetchingStatementResult = Boolean(
        useSelector(
            (state: IStoreState) =>
                state.queryExecutions.statementResultLoadingById[
                    statementExecution.id
                ]
        )
    );

    const [resultLimit, setResultLimit] = useState(
        StatementExecutionDefaultResultSize
    );

    const loadStatementResult = useCallback(
        (id: number, limit: number) => dispatch(fetchResult(id, limit)),
        [dispatch]
    );

    useEffect(() => {
        if (statementExecution.result_row_count > 0) {
            loadStatementResult(statementExecution.id, resultLimit);
        }
    }, [
        statementExecution.id,
        statementExecution.result_row_count,
        resultLimit,
        loadStatementResult,
    ]);

    return {
        resultLimit,
        setResultLimit,

        statementResult,
        isFetchingStatementResult,
    };
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
        const [processedMeta, metaProperties] =
            sanitizeAndExtraMarkdown(metaInfo);
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

    showStatementLogs,
    showStatementMeta,
    toggleStatementMeta,

    queryExecutionId,
}) => {
    const [showInFullScreen, , toggleFullScreen] = useToggleState(false);
    const statementMeta = useStatementMeta(
        statementExecution.meta_info,
        showStatementMeta,
        toggleStatementMeta
    );

    const {
        resultLimit,
        setResultLimit,
        isFetchingStatementResult,
        statementResult,
    } = useStatementResult(statementExecution);

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
            const statusLabel = (
                <span className="statement-status-label">Running</span>
            );
            const progressBar = percentComplete != null && (
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
                        resultLimit={resultLimit}
                        setResultLimit={setResultLimit}
                        isFetchingStatementResult={isFetchingStatementResult}
                        queryExecutionId={queryExecutionId}
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
                    setResultLimit={setResultLimit}
                    resultLimit={resultLimit}
                    isFetchingStatementResult={isFetchingStatementResult}
                    queryExecutionId={queryExecutionId}
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
