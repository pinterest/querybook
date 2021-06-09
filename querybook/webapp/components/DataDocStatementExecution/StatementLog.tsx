import clsx from 'clsx';
import { debounce } from 'lodash';
import React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { matchKeyPress } from 'lib/utils/keyboard';
import { IStatementLog } from 'redux/queryExecutions/types';
import { fetchLog } from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Message } from 'ui/Message/Message';
import { Loader } from 'ui/Loader/Loader';
import { SoftButton } from 'ui/Button/Button';

import './StatementLog.scss';

interface IStatementLogProps {
    statementLog: IStatementLog;
}

export const StatementLog: React.FunctionComponent<IStatementLogProps> = ({
    statementLog,
}) => {
    const [fullScreen, setFullScreen] = React.useState(false);
    const [scrollPosition, setScrollPosition] = React.useState<number>(null);
    const selfRef = React.useRef<HTMLDivElement>();
    const logRef = React.useRef<HTMLDivElement>();
    const {
        data = [],

        failed,
        error,
    } = statementLog || ({} as any);
    const logText: string = React.useMemo(() => (data ?? []).join('\n'), [
        data,
    ]);

    React.useEffect(() => {
        // Auto scroll logs to bottom when getting new logs
        if (logRef.current) {
            const logDiv = logRef.current;
            logDiv.scrollTop =
                scrollPosition === null ? logDiv.scrollHeight : scrollPosition;
        }
    }, [data]);

    const toggleFullscreen = React.useCallback(() => {
        setFullScreen((fullScreen) => {
            if (!fullScreen && selfRef.current) {
                selfRef.current.focus();
            }
            return !fullScreen;
        });
    }, [selfRef]);

    const updateScrollPosition = React.useCallback(
        debounce((scrollTop: number) => {
            if (logRef.current) {
                const logDiv = logRef.current;
                setScrollPosition(
                    // If at bottom, don't record scroll Position
                    scrollTop === logDiv.scrollHeight - logDiv.clientHeight
                        ? null
                        : scrollTop
                );
            }
        }, 100),
        [logRef]
    );

    if (failed) {
        return (
            <Message
                title="Cannot Load Statement Log"
                message={error}
                type="error"
            />
        );
    }

    if (logText.length === 0) {
        return null;
    }

    const toggleFullScreenButtonDOM = (
        <SoftButton
            color="light"
            icon="maximize"
            title={fullScreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen'}
            onClick={toggleFullscreen}
            className="toggle-fullscreen-button"
            size={fullScreen ? 'medium' : 'small'}
        />
    );

    const logViewerDOM = (
        <div
            ref={logRef}
            onScroll={(event) => {
                if (event.target === logRef.current) {
                    updateScrollPosition(logRef.current.scrollTop);
                }
            }}
            className="statement-execution-log-container"
            dangerouslySetInnerHTML={{
                __html: logText,
            }}
        />
    );

    return (
        <div
            className={clsx({
                StatementExecutionLog: true,
                'is-fullscreen': fullScreen,
            })}
            // for keypress to work
            tabIndex={1}
            onKeyDown={(event) => {
                if (matchKeyPress(event, 'ESC') && fullScreen) {
                    setFullScreen(false);
                    event.stopPropagation();
                }
            }}
            ref={selfRef}
        >
            <div className="right-align">{toggleFullScreenButtonDOM}</div>
            {logViewerDOM}
        </div>
    );
};

export const StatementLogWrapper: React.FunctionComponent<{
    statementId: number;
}> = ({ statementId }) => {
    const statementLog = useSelector(
        (state: IStoreState) =>
            state.queryExecutions.statementLogById[statementId]
    );
    const dispatch: Dispatch = useDispatch();
    const loadStatementLog = () => dispatch(fetchLog(statementId));

    return (
        <Loader
            item={statementLog}
            itemLoader={loadStatementLog}
            itemKey={statementId}
        >
            {statementLog && <StatementLog statementLog={statementLog} />}
        </Loader>
    );
};
