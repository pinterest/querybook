import clsx from 'clsx';
import moment from 'moment';
import React, { useCallback, useMemo, useRef } from 'react';

import { IQueryEngine } from 'const/queryEngine';
import { IQueryExecution } from 'const/queryExecution';
import { queryStatusToStatusIcon } from 'const/queryStatus';
import history from 'lib/router-history';
import {
    formatDuration,
    fromNow,
    generateFormattedDate,
} from 'lib/utils/datetime';
import { getWithinEnvUrl } from 'lib/utils/query-string';
import { UrlContextMenu } from 'ui/ContextMenu/UrlContextMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { AccentText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

interface IProps {
    queryExecution: IQueryExecution;
    queryEngineById: Record<number, IQueryEngine>;
}

const ExecutionTime: React.FC<{ queryExecution: IQueryExecution }> = ({
    queryExecution,
}) => {
    const durationText = useMemo(() => {
        const { created_at: createdAt, completed_at: completedAt } =
            queryExecution;

        if (completedAt == null) {
            // query may still be running, then there is no point to show anything yet
            return null;
        } else if (createdAt === completedAt) {
            return 'Less than 1s';
        } else {
            return formatDuration(
                moment.duration(completedAt - createdAt, 'seconds')
            );
        }
    }, [queryExecution]);

    if (!durationText) {
        return null;
    }

    return <span>{durationText}</span>;
};

export const QueryResult: React.FunctionComponent<IProps> = ({
    queryEngineById,
    queryExecution,
}) => {
    const selfRef = useRef<HTMLDivElement>();
    const queryId = queryExecution.id;
    const queryCode = queryExecution.query;

    const [createdAtFromNow, formattedCreatedAtDate] = useMemo(() => {
        const createdAt = queryExecution.created_at;
        return [fromNow(createdAt), generateFormattedDate(createdAt)];
    }, [queryExecution.created_at]);

    const queryExecutionUrl = useMemo(
        () => getWithinEnvUrl(`/query_execution/${queryId}/`),
        [queryId]
    );
    const handleClick = useCallback(() => {
        history.push(queryExecutionUrl, { isModal: true });
    }, [queryExecutionUrl]);

    return (
        <>
            <div
                className={clsx('QueryResult')}
                onClick={handleClick}
                ref={selfRef}
            >
                <div className="exec-header horizontal-space-between mb4">
                    <div className="flex-row">
                        <StatusIcon
                            status={
                                queryStatusToStatusIcon[queryExecution.status]
                            }
                        />
                        <AccentText className="mr8" size="small" weight="bold">
                            Execution {queryId}
                        </AccentText>
                    </div>
                    <Tag mini light>
                        {queryEngineById[queryExecution.engine_id].name}
                    </Tag>
                </div>
                <div className="query-context mb4">
                    {queryCode.slice(0, 60)}
                </div>
                <AccentText
                    className="horizontal-space-between"
                    size="xsmall"
                    color="lightest"
                >
                    <ExecutionTime queryExecution={queryExecution} />
                    <div
                        aria-label={formattedCreatedAtDate}
                        data-balloon-pos="left"
                    >
                        {createdAtFromNow}
                    </div>
                </AccentText>
            </div>
            <UrlContextMenu anchorRef={selfRef} url={queryExecutionUrl} />
        </>
    );
};
