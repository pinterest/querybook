import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Icon, IIconProps } from './Icon';

export const _Icon = (args: IIconProps) => <Icon {...args} />;

_Icon.args = {
    size: 16,
    name: 'lucide',
    fill: false,
};

_Icon.argTypes = {
    size: {
        control: {
            type: 'range',
            min: 10,
            max: 50,
        },
    },
};

export default {
    title: 'Stateless/Icon',
    decorators: [centered],
};
