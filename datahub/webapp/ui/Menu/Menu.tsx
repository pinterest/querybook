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
export const MenuItem = styled.div.attrs<{}>({
    className: 'MenuItem',
})``;
export const MenuInfoItem = styled.div.attrs<{}>({
    className: 'MenuInfoItem',
})``;
export const MenuDivider = styled.div.attrs<{}>({
    className: 'MenuDivider',
})`
    background-color: var(--inner-border-color);
    display: block;
    height: 1px;
    margin: 0px;
`;
