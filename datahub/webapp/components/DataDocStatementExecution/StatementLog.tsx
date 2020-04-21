import classNames from 'classnames';
import { debounce } from 'lodash';
import React from 'react';

import { useSelector, useDispatch } from 'react-redux';

import { matchKeyPress } from 'lib/utils/keyboard';
import { IStatementLog } from 'redux/queryExecutions/types';
import { fetchLog } from 'redux/queryExecutions/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import { Message } from 'ui/Message/Message';
import { Loader } from 'ui/Loader/Loader';

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

    React.useEffect(() => {
        if (logRef.current) {
            const logDiv = logRef.current;
            logDiv.scrollTop =
                scrollPosition === null || !fullScreen
                    ? logDiv.scrollHeight // scroll to bottom
                    : scrollPosition;
        }
    }, [statementLog]);

    const toggleFullscreen = React.useCallback(() => {
        if (!fullScreen && selfRef.current) {
            selfRef.current.focus();
        }
        setFullScreen(!fullScreen);
    }, [selfRef, fullScreen]);

    const updateScrollPosition = React.useMemo(
        () =>
            debounce((scrollTop: number) => {
                if (fullScreen && logRef.current) {
                    const logDiv = logRef.current;
                    setScrollPosition(
                        // If at bottom, don't record scroll Position
                        scrollTop === logDiv.scrollHeight - logDiv.clientHeight
                            ? null
                            : scrollTop
                    );
                }
            }, 100),
        [fullScreen, logRef]
    );

    const {
        data = [],

        failed,
        error,
    } = statementLog || ({} as any);

    if (failed) {
        return (
            <Message
                title="Cannot Load Statement Log"
                message={error}
                type="error"
            />
        );
    }

    const logLines = data;
    if (logLines.length === 0) {
        return null;
    }

    const goFullScreenOverlayDOM = fullScreen ? null : (
        <div className="go-fullscreen-overlay" onClick={toggleFullscreen}>
            <div className="go-fullscreen-main-button">View</div>
        </div>
    );

    const exitFullScreenButtonDOM = fullScreen ? (
        <div className="exit-fullscreen-button" onClick={toggleFullscreen}>
            Exit Fullscreen (Esc)
        </div>
    ) : null;

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
                __html: (fullScreen ? logLines : logLines.slice(-15)).join(
                    '\n'
                ),
            }}
        />
    );

    return (
        <div
            className={classNames({
                StatementExecutionLog: true,
                'log-viewer': true,
                'is-fullscreen': fullScreen,
            })}
            onKeyDown={(event) => {
                if (matchKeyPress(event, 'ESC') && fullScreen) {
                    setFullScreen(false);
                }
            }}
            ref={selfRef}
            tabIndex={1}
        >
            {goFullScreenOverlayDOM}
            {exitFullScreenButtonDOM}
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
