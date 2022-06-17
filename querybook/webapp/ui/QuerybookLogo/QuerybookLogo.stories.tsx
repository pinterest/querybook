import centered from '@storybook/addon-centered/react';
import React from 'react';

import { QuerybookLogo } from './QuerybookLogo';

export default {
    title: 'Stateless/QuerybookLogo',
    decorators: [centered],
};
export const _QuerybookLogo = (args) => <QuerybookLogo {...args} />;

_QuerybookLogo.args = {
    size: 2,
    withBrandMark: true,
};

_QuerybookLogo.argTypes = {
    size: {
        control: {
            type: 'range',
            min: 1,
            max: 10,
        },
    },
};
