import React from 'react';
import styled from 'styled-components';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';

const StyledButton = styled.span`
    background-color: transparent;
    margin: 0px;
    color: var(--text);
    font-weight: bold;
    font-size: var(--text-size);
    padding: 5px 10px;
    border: 1px solid transparent;

    display: inline-flex;
    align-items: center;

    &:hover,
    &.active {
        background-color: var(--bg-light);
        color: var(--text-dark);
    }
`;

export interface IToolBarButtonProps {
    active?: boolean;
    icon: AllLucideIconNames;
    title?: string;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => any;
    className?: string;
    tooltip?: string;
    buttonRef?: React.Ref<HTMLButtonElement>;
}

export const ToolBarButton: React.FunctionComponent<IToolBarButtonProps> = ({
    active = false,
    icon,
    title = '',
    onClick,
    className = '',
    tooltip = '',
    buttonRef,
}) => {
    const iconDOM = icon ? <Icon name={icon} size={18} /> : null;
    const buttonClassName = className + (active ? 'active' : '');

    return (
        <StyledButton
            className={buttonClassName}
            onMouseDown={onClick}
            aria-label={tooltip}
            data-balloon-pos={'up'}
            ref={buttonRef}
        >
            {iconDOM}
            {title}
        </StyledButton>
    );
};
