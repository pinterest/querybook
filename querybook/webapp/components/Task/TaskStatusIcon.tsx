import React from 'react';
import styled from 'styled-components';
import { StatusTypes, TaskRunStatus } from 'const/schedule';
import { Icon } from 'ui/Icon/Icon';
import { AccentText } from 'ui/StyledText/StyledText';

const StyledStatusIcon = styled.div`
    &.status-success {
        color: var(--color-true);
        * {
            color: var(--color-true);
        }
    }

    &.status-in-progress {
        color: var(--color-blue-dark);
        * {
            color: var(--color-blue-dark);
        }
    }

    &.status-failure {
        color: var(--color-false);
        * {
            color: var(--color-false);
        }
    }
`;

interface IStatusProps {
    type: TaskRunStatus;
}

export const TaskStatusIcon: React.FunctionComponent<IStatusProps> = ({
    type = 0,
}) => {
    const status = StatusTypes[type];
    return (
        <StyledStatusIcon className={status.class + ' flex-row'}>
            <Icon className="mr4" name={status.iconName} size={16} />
            <AccentText>{status.text}</AccentText>
        </StyledStatusIcon>
    );
};
