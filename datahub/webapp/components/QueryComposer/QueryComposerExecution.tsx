import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
    queryStatusToStatusIcon,
    STATUS_TO_TEXT_MAPPING,
} from 'const/queryStatus';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IStoreState } from 'redux/store/types';

import { QueryExecution } from 'components/QueryExecution/QueryExecution';
import { Level } from 'ui/Level/Level';
import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';

interface IProps {
    id: number;
}

export const QueryComposerExecution: React.FunctionComponent<IProps> = ({
    id,
}) => {
    const environment = useSelector(currentEnvironmentSelector);
    const execution = useSelector(
        (state: IStoreState) => state.queryExecutions.queryExecutionById[id]
    );
    const permalink = useMemo(() => {
        if (!execution) {
            return null;
        }
        return `${location.protocol}//${location.host}/${environment.name}/query_execution/${execution.id}/`;
    }, [execution]);

    if (!execution) {
        return null;
    }

    const statusTooltip =
        STATUS_TO_TEXT_MAPPING[execution.status] || 'Status not found';
    const statusIcon = (
        <StatusIcon
            tooltip={statusTooltip}
            status={queryStatusToStatusIcon[execution.status]}
        />
    );

    return (
        <div className="QueryComposerExecution">
            <Level>
                <div>
                    {statusIcon} Execution {execution.id}
                </div>
                <div className="flex-row">
                    <QueryExecutionBar
                        queryExecution={execution}
                        permalink={permalink}
                    />
                </div>
            </Level>
            <QueryExecution id={id} />
        </div>
    );
};
