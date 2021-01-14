import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Icon, IIconProps } from './Icon';

export const _Icon = (args: IIconProps) => <Icon {...args} />;

_Icon.args = {
    size: 16,
    name: 'feather',
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
