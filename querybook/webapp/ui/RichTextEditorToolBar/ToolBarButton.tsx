import React from 'react';
import styled from 'styled-components';

const StyledButton = styled.button`
    background-color: transparent;
    margin: 0px;
    color: var(--text-color);
    font-weight: bold;
    font-size: var(--text-size);
    padding: 5px 10px;
    border: 1px solid transparent;

    &:hover,
    &.active {
        background-color: var(--light-bg-color);
        color: var(--dark-text-color);
    }
`;

export interface IToolBarButtonProps {
    active?: boolean;
    icon: string;
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
    const iconDOM = icon ? <i className={'fa ' + ('fa-' + icon)} /> : null;
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
