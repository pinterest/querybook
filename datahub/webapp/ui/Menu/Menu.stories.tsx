import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import {
    Menu,
    MenuInfoItem,
    MenuItem,
    MenuItemPing,
    MenuDivider,
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
