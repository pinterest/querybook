import React, { useMemo } from 'react';
import moment from 'moment';
import clsx from 'clsx';
import styled from 'styled-components';

import { queryStatusToStatusIcon } from 'const/queryStatus';
import { IQueryExecution } from 'const/queryExecution';
import { IQueryEngine } from 'const/queryEngine';
import { UserName } from 'components/UserBadge/UserName';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { Title } from 'ui/Title/Title';
import { Tag } from 'ui/Tag/Tag';

interface IProps {
    queryExecution: IQueryExecution;
    queryEngineById: Record<number, IQueryEngine>;
    onClick: (queryExecution: IQueryExecution) => any;
}

const TimeContainer = styled.div`
    display: flex;
`;

const ExecutionTime = styled.div`
    margin-right: 10px;
`;

function calculateExecutionTime(createdAt: number, completedAt: number) {
    const executionTime = Math.ceil(completedAt - createdAt);
    const date = new Date(null);
    date.setSeconds(executionTime);

    return date.toISOString().substr(11, 8);
}

const GetExecutionTime: React.FunctionComponent<{
    createdAt: number;
    completedAt: number;
}> = ({ createdAt, completedAt }) => {
    const hoursAndMinutesTime = useMemo(() => {
        if (!completedAt) {
            return 'Ex. time: --:--:--';
        }

        if (createdAt - completedAt === 0) {
            return 'Ex. time: Less 1 sec.';
        }

        return `Ex. time: ${calculateExecutionTime(createdAt, completedAt)}`;
    }, [createdAt, completedAt]);

    return <ExecutionTime>{hoursAndMinutesTime}</ExecutionTime>;
};

export const QueryResult: React.FunctionComponent<IProps> = ({
    queryEngineById,
    queryExecution,
    onClick,
}) => {
    const queryId = queryExecution.id;
    const className = clsx({
        QueryResult: true,
    });

    const queryCode = queryExecution.query;

    return (
        <div className={className} onClick={() => onClick(queryExecution)}>
            <div className="exec-header horizontal-space-between mb4">
                <div className="flex-row">
                    <StatusIcon
                        status={queryStatusToStatusIcon[queryExecution.status]}
                    />
                    <Title size={6} className="mr8">
                        Execution {queryId}
                    </Title>
                </div>
                <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
            </div>
            <Title subtitle size={7} className="query-context mb4">
                {queryCode.slice(0, 60)}
            </Title>
            <div className="horizontal-space-between">
                <div>
                    <UserName uid={queryExecution.uid} />
                </div>
                <TimeContainer>
                    <GetExecutionTime
                        completedAt={queryExecution.completed_at}
                        createdAt={queryExecution.created_at}
                    />
                    {moment.utc(queryExecution.created_at, 'X').fromNow()}
                </TimeContainer>
            </div>
        </div>
    );
};
