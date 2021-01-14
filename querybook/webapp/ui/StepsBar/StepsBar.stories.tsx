import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { StepsBar } from './StepsBar';

const Steps = [
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
];

export const _StepsBar = (args) => {
    const { numStep, ...otherArgs } = args;
    return (
        <>
            <div style={{ width: '1000px', alignItems: 'stretch' }}>
                <StepsBar steps={Steps.slice(0, numStep)} {...otherArgs} />
            </div>
        </>
    );
};

_StepsBar.args = {
    numStep: 10,
    activeStep: 5,
};
_StepsBar.argTypes = {
    numStep: {
        control: {
            type: 'range',
            min: 1,
            max: 10,
        },
    },
    activeStep: {
        control: {
            type: 'range',
            min: 0,
            max: 9,
        },
    },
};

export default {
    title: 'Stateless/StepsBar',
    decorators: [centered],
};
