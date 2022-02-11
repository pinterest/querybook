import React, { useMemo } from 'react';
import moment from 'moment';
import clsx from 'clsx';

import { queryStatusToStatusIcon } from 'const/queryStatus';
import { IQueryExecution } from 'const/queryExecution';
import { IQueryEngine } from 'const/queryEngine';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Title } from 'ui/Title/Title';
import { Tag } from 'ui/Tag/Tag';
import {
    formatDuration,
    fromNow,
    generateFormattedDate,
} from 'lib/utils/datetime';
import { Icon } from 'ui/Icon/Icon';

interface IProps {
    queryExecution: IQueryExecution;
    queryEngineById: Record<number, IQueryEngine>;
    onClick: (queryExecution: IQueryExecution) => any;
}

const ExecutionTime: React.FC<{ queryExecution: IQueryExecution }> = ({
    queryExecution,
}) => {
    const durationText = useMemo(() => {
        const {
            created_at: createdAt,
            completed_at: completedAt,
        } = queryExecution;

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

    return (
        <div className="ExecutionTime flex-row">
            <Icon name="clock" size={14} />
            <span>{durationText}</span>
        </div>
    );
};

export const QueryResult: React.FunctionComponent<IProps> = ({
    queryEngineById,
    queryExecution,
    onClick,
}) => {
    const queryId = queryExecution.id;
    const queryCode = queryExecution.query;

    const [createdAtFromNow, formattedCreatedAtDate] = useMemo(() => {
        const createdAt = queryExecution.created_at;
        return [fromNow(createdAt), generateFormattedDate(createdAt)];
    }, [queryExecution.created_at]);

    return (
        <div
            className={clsx('QueryResult')}
            onClick={() => onClick(queryExecution)}
        >
            <div className="exec-header horizontal-space-between mb4">
                <div className="flex-row">
                    <StatusIcon
                        status={queryStatusToStatusIcon[queryExecution.status]}
                    />
                    <Title size={6} className="mr8">
                        Run {queryId}
                    </Title>
                </div>
                <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
            </div>
            <Title subtitle size={8} className="query-context mb4">
                {queryCode.slice(0, 60)}
            </Title>
            <div className="horizontal-space-between">
                <ExecutionTime queryExecution={queryExecution} />
                <div aria-label={formattedCreatedAtDate} data-balloon-pos="up">
                    {createdAtFromNow}
                </div>
            </div>
        </div>
    );
};
