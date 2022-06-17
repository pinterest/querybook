import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Center } from './Center';

export default {
    title: 'Layout/Center',
    decorators: [centered],
};
export const _Center = (args) => <Center>{args.children}</Center>;
_Center.args = {
    children: 'Centered content',
};
