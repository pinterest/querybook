import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { IconButton, IconButtonProps } from './IconButton';

export const _IconButton = (args: IconButtonProps) => (
    <IconButton
        onClick={() => {
            window.alert('Hello World');
        }}
        {...args}
    />
);
_IconButton.args = {
    icon: 'heart',
    tooltip: 'This is a tooltip',
    size: 24,
};

_IconButton.argTypes = {
    tooltip: {
        control: {
            type: 'text',
        },
    },
    size: {
        control: {
            type: 'range',
            min: 10,
            max: 80,
        },
    },
    ping: {
        control: {
            type: 'text',
        },
    },
};

export default {
    title: 'Button/IconButton',
    decorators: [centered],
    component: _IconButton,
};
