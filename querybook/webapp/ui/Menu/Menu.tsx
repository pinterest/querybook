import styled from 'styled-components';

import './Menu.scss';

export const Menu = styled.div.attrs<{
    height: number;
}>({
    className: 'Menu',
})`
    ${(props) =>
        props.height &&
        `maxHeight: ${props.height};
        overflow-x: hidden;
        overflow-y: auto;`};
`;
export const MenuItem = styled.span.attrs({
    className: 'MenuItem',
})``;
export const MenuInfoItem = styled.div.attrs({
    className: 'MenuInfoItem',
})``;
export const MenuDivider = styled.div.attrs({
    className: 'MenuDivider',
})`
    background-color: var(--border-color);
    display: block;
    height: 1px;
    margin: 0px;
`;
export const MenuItemPing = styled.div.attrs({
    className: 'MenuItemPing',
})`
    pointer-events: none;
    border-radius: 100px;
    background-color: var(--color-accent-bg);
    width: 8px;
    height: 8px;
    margin-left: 8px;
    margin-right: -8px;
`;
