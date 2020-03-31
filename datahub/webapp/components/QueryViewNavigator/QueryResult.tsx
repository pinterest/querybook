import React from 'react';
import moment from 'moment';
import classNames from 'classnames';

import { queryStatusToStatusIcon } from 'const/queryStatus';
import { IQueryExecution } from 'redux/queryExecutions/types';
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

export const QueryResult: React.FunctionComponent<IProps> = ({
    queryEngineById,
    queryExecution,
    onClick,
}) => {
    const queryId = queryExecution.id;
    const className = classNames({
        QueryResult: true,
    });

    const queryCode = queryExecution.query;

    return (
        <div className={className} onClick={() => onClick(queryExecution)}>
            <Title size={6} className="flex-row">
                <StatusIcon
                    status={queryStatusToStatusIcon[queryExecution.status]}
                />
                Execution {queryId} &nbsp;
                <Tag>{queryEngineById[queryExecution.engine_id].name}</Tag>
            </Title>
            <Title subtitle size={6} className="query-context">
                {queryCode.slice(0, 60)}
            </Title>
            <div className="horizontal-space-between">
                <div>
                    <UserName uid={queryExecution.uid} />
                </div>
                <div>
                    {moment.utc(queryExecution.created_at, 'X').fromNow()}
                </div>
            </div>
        </div>
    );
};
