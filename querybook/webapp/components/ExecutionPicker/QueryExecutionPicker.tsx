import React from 'react';
import moment from 'moment';
import clsx from 'clsx';

import {
    queryStatusToStatusIcon,
    STATUS_TO_TEXT_MAPPING,
} from 'const/queryStatus';
import { QueryExecutionStatus, IQueryExecution } from 'const/queryExecution';
import { generateFormattedDate } from 'lib/utils/datetime';

import { UserName } from 'components/UserBadge/UserName';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Menu, MenuItem } from 'ui/Menu/Menu';

import './QueryExecutionPicker.scss';
import { Icon } from 'ui/Icon/Icon';

interface IProps {
    queryExecutionId: number;
    onSelection: (id: number) => any;
    queryExecutions?: IQueryExecution[];
    autoSelect?: boolean;
    shortVersion?: boolean;
}
export const QueryExecutionPicker: React.FunctionComponent<IProps> = React.memo(
    ({
        queryExecutionId,
        onSelection,
        queryExecutions,
        autoSelect,
        shortVersion,
    }) => {
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
            }, [hideFailed, queryExecutions]) ?? [];

        // Create an unique representation of query executions with its ids
        // used for memo in autoSelect
        const queryExecutionsStr = React.useMemo(
            () => JSON.stringify(filteredQueryExecutions.map((q) => q.id)),
            [filteredQueryExecutions]
        );

        // Whenever there are new executions, always go to the first one
        React.useEffect(() => {
            if (autoSelect && filteredQueryExecutions.length > 0) {
                onSelection(filteredQueryExecutions[0].id);
            }
        }, [autoSelect, queryExecutionsStr]);

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

            const text = execution
                ? `Execution ${execution.id}`
                : 'Execution not found';

            return (
                <div className="execution-selector-button flex-row">
                    <span className="mr8">{text}</span>
                    {statusIcon}
                    <Icon name="ChevronDown" size={16} />
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
                        (shortVersion
                            ? ''
                            : ', ' + moment.utc(createdAt, 'X').fromNow(true));

                    return (
                        <MenuItem
                            key={execution.id}
                            className={clsx({
                                'query-execution-item': true,
                                'query-execution-selected':
                                    execution.id === queryExecutionId,
                                'flex-row': true,
                            })}
                            onClick={() => onSelection(execution.id)}
                        >
                            {shortVersion ? '#' : 'Execution '}
                            {execution.id}: {dateString}
                            {!shortVersion && (
                                <>
                                    <span className="mh4">ago by</span>
                                    <UserName uid={execution.uid} />
                                </>
                            )}
                            <span className="ml8 flex-center">
                                {statusIcon}
                            </span>
                        </MenuItem>
                    );
                }
            );
            return (
                <Menu>
                    <div className="query-execution-item-header flex-row">
                        <span className="mr12">Hide Failed</span>
                        <ToggleSwitch
                            checked={hideFailed}
                            onChange={setHideFailed}
                        />
                    </div>
                    <div className="query-execution-item-wrapper">
                        {executionItemsDOM}
                    </div>
                </Menu>
            );
        }, [filteredQueryExecutions, queryExecutionId, hideFailed]);

        return (
            <Dropdown
                className="QueryExecutionPicker"
                customButtonRenderer={executionSelectorButton}
            >
                {executionMenuRenderer()}
            </Dropdown>
        );
    }
);
