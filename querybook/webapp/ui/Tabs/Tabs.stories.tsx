import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Tabs } from './Tabs';

export const _Tab = (args) => {
    const [selectedTabKey, setSelectedTabKey] = React.useState('one');

    return (
        <div style={{ width: '500px' }}>
            <Tabs
                {...args}
                items={['one', 'two', 'three']}
                selectedTabKey={selectedTabKey}
                onSelect={setSelectedTabKey}
            />
        </div>
    );
};
_Tab.args = {
    className: '',
    vertical: false,
    pills: false,
    wide: false,
    size: 'small',
    align: 'center',
};

_Tab.argTypes = {
    size: {
        control: {
            type: 'select',
            options: ['small', 'large'],
        },
    },
    align: {
        control: {
            type: 'select',
            options: ['right', 'left', 'center'],
        },
    },
};

export default {
    title: 'Stateful/Tabs',
    decorators: [centered],
};
