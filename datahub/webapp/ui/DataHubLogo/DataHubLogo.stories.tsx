import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { DataHubLogo } from './DataHubLogo';

export default {
    title: 'Stateless/DataHubLogo',
    decorators: [centered],
};
export const _DataHubLogo = (args) => <DataHubLogo {...args} />;

_DataHubLogo.args = {
    size: 2,
};

_DataHubLogo.argTypes = {
    size: {
        control: {
            type: 'range',
            min: 1,
            max: 10,
        },
    },
};
