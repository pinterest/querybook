import clsx from 'clsx';
import styled from 'styled-components';

import './Menu.scss';

interface IMenuProps {
    height?: number;
    boxShadow?: boolean;
}

export const Menu = styled.div.attrs<IMenuProps>({
    className: 'Menu',
})<IMenuProps>`
    ${(props) =>
        props.height &&
        `max-height: ${props.height};
        overflow-x: hidden;
        overflow-y: auto;`}
    ${(props) => props.boxShadow && 'box-shadow: var(--box-shadow);'}
`;
export const MenuItem = styled.span.attrs((props: { className?: string }) => ({
    className: clsx('MenuItem', props.className),
}))``;
export const MenuInfoItem = styled.div.attrs({
    className: 'MenuInfoItem',
})``;
export const MenuDivider = styled.div.attrs({
    className: 'MenuDivider',
})`
    display: block;
    height: 12px;
    margin: 0px;
`;
export const MenuItemPing = styled.div.attrs({
    className: 'MenuItemPing',
})`
    pointer-events: none;
    border-radius: 100px;
    background-color: var(--color-accent-light);
    width: 8px;
    height: 8px;
    margin-left: 8px;
    margin-right: -8px;
`;
