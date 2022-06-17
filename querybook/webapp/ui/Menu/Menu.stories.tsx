import centered from '@storybook/addon-centered/react';
import React from 'react';

import {
    Menu,
    MenuDivider,
    MenuInfoItem,
    MenuItem,
    MenuItemPing,
} from './Menu';

export const _Menu = () => (
    <Menu>
        <MenuItem>First Item</MenuItem>
        <MenuItem>
            Second Item with Ping
            <MenuItemPing />
        </MenuItem>
        <MenuDivider />
        <MenuInfoItem>Info Item</MenuInfoItem>
    </Menu>
);
export default {
    title: 'Stateless/Menu',
    decorators: [centered],
};
