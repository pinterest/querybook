import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Divider } from './Divider';

export default {
    title: 'Stateless/Divider',
    decorators: [centered],
};
export const _Divider = (args) => (
    <div style={{ width: '240px' }}>
        <div>Text Above</div>
        <Divider {...args} />
        <div>Text Below</div>
    </div>
);

_Divider.args = {
    marginTop: '8px',
    marginBottom: '4px',
    color: 'var(--color-accent)',
    height: '4px',
};
