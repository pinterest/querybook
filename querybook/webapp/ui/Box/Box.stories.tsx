import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Box } from './Box';

export default {
    title: 'Layout/Box',
    decorators: [centered],
};

export const _Box = ({ ...args }) => <Box {...args} />;
_Box.args = {
    children: 'Box',
};
_Box.argTypes = {
    children: { control: 'text' },
};
