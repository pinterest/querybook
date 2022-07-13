import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Button } from 'ui/Button/Button';
import { ListMenu } from 'ui/Menu/ListMenu';

import { Dropdown } from './Dropdown';

export default {
    title: 'Stateful/Dropdown',
    decorators: [centered],
};
export const _Dropdown = (args) => (
    <>
        <Dropdown {...args}>
            <ListMenu
                items={[{ name: 'Dropdown Item' }, { name: 'with ListMenu' }]}
            />
        </Dropdown>
        <div className="mb12" />
        <Dropdown
            {...args}
            customButtonRenderer={() => (
                <Button icon={'ChevronDown'} title="Dropdown" />
            )}
        >
            <ListMenu
                items={[
                    { name: 'Soft Dropdown' },
                    { name: 'with Custom Button' },
                    {
                        name: 'Nested Item',
                        items: [
                            { name: 'Nested Option 1' },
                            { name: 'Nested Option 2' },
                        ],
                    },
                ]}
                soft
            />
        </Dropdown>
    </>
);

_Dropdown.args = {
    menuIcon: 'menu',
    hoverable: false,
    layout: ['bottom', 'right'],
};
