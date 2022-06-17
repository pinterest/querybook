import centered from '@storybook/addon-centered/react';
import React from 'react';

// eslint-disable-next-line import/no-extraneous-dependencies
import { ToggleSwitch } from './ToggleSwitch';

export const _ToggleSwitch = () => {
    const [checked, setChecked] = React.useState(false);
    const onChange = () => {
        setChecked(!checked);
    };
    return <ToggleSwitch checked={checked} onChange={onChange} />;
};

export default {
    title: 'Form/ToggleSwitch',
    decorators: [centered],
};
