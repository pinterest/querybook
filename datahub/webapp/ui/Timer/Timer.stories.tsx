import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Timer } from './Timer';

export const _Timer = () => <Timer />;

export default {
    title: 'Stateless/Timer',
    decorators: [centered],
};
