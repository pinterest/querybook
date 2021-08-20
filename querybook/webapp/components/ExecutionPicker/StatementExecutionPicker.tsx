import React from 'react';

import { queryStatusToStatusIcon, Status } from 'const/queryStatus';
import { IStatementExecution } from 'const/queryExecution';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';
import { ListMenu } from 'ui/Menu/ListMenu';

import './StatementExecutionPicker.scss';

interface IProps {
    statementExecutionId?: number;
    onSelection: (id: number) => any;
    statementExecutions?: IStatementExecution[];
    autoSelect?: boolean;
    total?: number;
}
export const StatementExecutionPicker: React.FunctionComponent<IProps> = ({
    statementExecutionId,
    onSelection,
    statementExecutions,
    autoSelect,
    total,
}) => {
    total = total ?? (statementExecutions || []).length;
    const [hasSelected, setHasSelected] = React.useState(false);
    React.useEffect(() => {
        if (
            autoSelect &&
            !hasSelected &&
            statementExecutions &&
            statementExecutions.length > 0
        ) {
            onSelection(statementExecutions[statementExecutions.length - 1].id);
        }
    }, [autoSelect, hasSelected, statementExecutions, onSelection]);

    const executionSelectorButton = () => {
        const selectedIndex = statementExecutions.findIndex(
            ({ id }) => id === statementExecutionId
        );
        const current = selectedIndex >= 0 ? selectedIndex + 1 : 'n/a';
        return (
            <div className="custom-statement-picker-button">
                Statement {current} out of {total}{' '}
                <i className="fa fa-caret-down dropdown-icon" />
            </div>
        );
    };

    const statementItems = [];
    for (let i = 0; i < total; i++) {
        const statementExecution = statementExecutions[i];
        const statusIcon = (
            <StatusIcon
                status={
                    statementExecution
                        ? queryStatusToStatusIcon[statementExecution.status]
                        : Status.none
                }
            />
        );

        statementItems.push({
            name: (
                <span className="statement-execution-tab-name">
                    {statusIcon} Statement {i + 1}
                </span>
            ),
            onClick: statementExecution
                ? () => {
                      setHasSelected(true);
                      onSelection(statementExecution.id);
                  }
                : null,
            checked: statementExecution
                ? statementExecution.id === statementExecutionId
                : false,
        });
    }
    return (
        <div className="StatementExecutionPicker">
            <Dropdown customButtonRenderer={executionSelectorButton}>
                <ListMenu items={statementItems} type="select" height={300} />
            </Dropdown>
        </div>
    );
};
