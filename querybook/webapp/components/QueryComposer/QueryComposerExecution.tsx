import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { QueryExecution } from 'components/QueryExecution/QueryExecution';
import { QueryExecutionDuration } from 'components/QueryExecution/QueryExecutionDuration';
import { QueryExecutionBar } from 'components/QueryExecutionBar/QueryExecutionBar';
import {
    queryStatusToStatusIcon,
    STATUS_TO_TEXT_MAPPING,
} from 'const/queryStatus';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { IStoreState } from 'redux/store/types';
import { Level } from 'ui/Level/Level';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { AccentText } from 'ui/StyledText/StyledText';

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
                <div className="flex-row">
                    <AccentText weight="bold" className="flex-row mr8">
                        {statusIcon}
                        <span className="execution-text ml4">
                            Execution {execution.id}
                        </span>
                    </AccentText>
                    <QueryExecutionDuration queryExecution={execution} />
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
