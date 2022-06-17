import React from 'react';

import { IStatementExecution } from 'const/queryExecution';
import { queryStatusToStatusIcon, Status } from 'const/queryStatus';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { ListMenu } from 'ui/Menu/ListMenu';
import { StatusIcon } from 'ui/StatusIcon/StatusIcon';

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
                Statement {current} out of {total}
                <Icon name="ChevronDown" size={16} className="ml4" />
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
                <span className="statement-execution-tab-name flex-row">
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
