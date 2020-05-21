import React from 'react';
import moment from 'moment';
import classNames from 'classnames';

import {
    queryStatusToStatusIcon,
    STATUS_TO_TEXT_MAPPING,
} from 'const/queryStatus';
import { QueryExecutionStatus } from 'const/queryExecution';
import { generateFormattedDate } from 'lib/utils/datetime';

import { IQueryExecution } from 'redux/queryExecutions/types';
import { UserName } from 'components/UserBadge/UserName';
import { DropdownMenu } from 'ui/DropdownMenu/DropdownMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import './QueryExecutionPicker.scss';

interface IProps {
    queryExecutionId: number;
    onSelection: (id: number) => any;
    queryExecutions?: IQueryExecution[];
    autoSelect?: boolean;
}
export const QueryExecutionPicker: React.FunctionComponent<IProps> = React.memo(
    ({ queryExecutionId, onSelection, queryExecutions, autoSelect }) => {
        const [hideFailed, setHideFailed] = React.useState(false);
        const filteredQueryExecutions =
            React.useMemo(() => {
                if (!hideFailed) {
                    return queryExecutions;
                }

                return queryExecutions.filter(
                    (qe) =>
                        qe.status !== QueryExecutionStatus.ERROR &&
                        qe.status !== QueryExecutionStatus.CANCEL
                );
            }, [hideFailed, queryExecutions]) || [];

        React.useEffect(() => {
            if (
                autoSelect &&
                queryExecutionId == null &&
                filteredQueryExecutions.length > 0
            ) {
                onSelection(filteredQueryExecutions[0].id);
            }
        }, [
            autoSelect,
            queryExecutionId,
            (filteredQueryExecutions || []).length,
        ]);

        const executionSelectorButton = React.useCallback(() => {
            const execution = queryExecutions.find(
                ({ id }) => id === queryExecutionId
            );
            const statusIcon = execution ? (
                <StatusIcon
                    tooltip={
                        STATUS_TO_TEXT_MAPPING[execution.status] ||
                        'Status not found'
                    }
                    status={queryStatusToStatusIcon[execution.status]}
                />
            ) : null;

            const textDOM = execution ? (
                <span>Execution {execution.id}</span>
            ) : (
                <span>Execution not found</span>
            );

            return (
                <div className="execution-selector-button">
                    {textDOM}
                    <span className="mh4">{statusIcon}</span>
                    <i className="fa fa-caret-down caret-icon" />
                </div>
            );
        }, [queryExecutionId, queryExecutions]);

        const executionMenuRenderer = React.useCallback(() => {
            const executionItemsDOM = filteredQueryExecutions.map(
                (execution) => {
                    const statusTooltip =
                        STATUS_TO_TEXT_MAPPING[execution.status] ||
                        'Status not found';
                    const statusIcon = (
                        <StatusIcon
                            tooltip={statusTooltip}
                            status={queryStatusToStatusIcon[execution.status]}
                        />
                    );
                    const createdAt = execution.created_at;
                    const dateString =
                        generateFormattedDate(createdAt, 'X') +
                        ', ' +
                        moment.utc(createdAt, 'X').fromNow();

                    return (
                        <a
                            key={execution.id}
                            className={classNames({
                                'Menu-item': true,
                                'query-execution-item': true,
                                'query-execution-selected':
                                    execution.id === queryExecutionId,
                            })}
                            onClick={() => onSelection(execution.id)}
                        >
                            Execution {execution.id}: {dateString} by
                            <span className="mh4">
                                <UserName uid={execution.uid} />
                            </span>
                            {statusIcon}
                        </a>
                    );
                }
            );
            return (
                <div className="Menu">
                    <div className="query-execution-item-header flex-row">
                        <span className="mr8">Hide Failed</span>
                        <ToggleSwitch
                            checked={hideFailed}
                            onChange={setHideFailed}
                        />
                    </div>
                    <div className="query-execution-item-wrapper">
                        {executionItemsDOM}
                    </div>
                </div>
            );
        }, [filteredQueryExecutions, queryExecutionId, hideFailed]);

        return (
            <DropdownMenu
                className="QueryExecutionPicker"
                customButtonRenderer={executionSelectorButton}
                customMenuRenderer={executionMenuRenderer}
            />
        );
    }
);
