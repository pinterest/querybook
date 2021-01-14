import React from 'react';
import styled from 'styled-components';
import { TaskRunStatus } from 'const/schedule';

const StyledStatusIcon = styled.div`
    &.status-success {
        color: var(--color-true);
    }

    &.status-in-progress {
        color: var(--color-warning-dark);
    }

    &.status-failure {
        color: var(--color-false);
    }
`;

interface IStatusTypeList {
    [key: number]: {
        class: string;
        iconClass: string;
        text: string;
    };
}

const statusTypes: IStatusTypeList = {
    [TaskRunStatus.RUNNING]: {
        class: 'status-in-progress',
        iconClass: 'fas fa-spinner fa-spin',
        text: 'In Progress',
    },
    [TaskRunStatus.SUCCESS]: {
        class: 'status-success',
        iconClass: 'fas fa-thumbs-up',
        text: 'Success',
    },
    [TaskRunStatus.FAILURE]: {
        class: 'status-failure',
        iconClass: 'fas fa-thumbs-down',
        text: 'Failure',
    },
};

interface IStatusProps {
    type: TaskRunStatus;
}

export const TaskStatusIcon: React.FunctionComponent<IStatusProps> = ({
    type = 0,
}) => {
    const status = statusTypes[type];
    return (
        <StyledStatusIcon className={status.class}>
            <span className="m4">
                <i className={status.iconClass} />
            </span>
            <span>{status.text}</span>
        </StyledStatusIcon>
    );
};
