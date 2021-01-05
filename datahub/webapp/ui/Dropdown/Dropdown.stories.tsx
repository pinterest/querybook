import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Dropdown } from './Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';
import { Button } from 'ui/Button/Button';

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
                <Button icon={'heart'} title="Dropdown" />
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
    isRight: false,
    isUp: false,
};
