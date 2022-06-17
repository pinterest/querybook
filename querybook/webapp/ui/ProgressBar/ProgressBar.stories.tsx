import centered from '@storybook/addon-centered/react';
import React from 'react';

import {
    IProgressBarProps,
    ProgressBar,
    ProgressBarTypes,
} from './ProgressBar';

export const _ProgressBar = (args: IProgressBarProps) => (
    <div style={{ width: '480px', alignItems: 'stretch' }}>
        <div className="mb12">
            Progress Bar
            <ProgressBar {...args} />
        </div>
    </div>
);

_ProgressBar.args = {
    value: 10,
    type: 'success',
    isSmall: false,
    showValue: false,
};

_ProgressBar.argTypes = {
    value: {
        control: {
            type: 'range',
            min: 0,
            max: 100,
            step: 0.5,
        },
    },
    type: {
        control: {
            type: 'select',
            options: ProgressBarTypes,
        },
    },
};

export default {
    title: 'Stateless/ProgressBar',
    decorators: [centered],
};
