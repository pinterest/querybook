import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { ToggleButton } from './ToggleButton';

export const _ToggleButton = () => {
    const [checked, setChecked] = React.useState(true);
    return (
        <ToggleButton
            onClick={() => setChecked((v) => !v)}
            checked={checked}
            title={checked ? 'Toggle Button - On' : 'Toggle Button - Off'}
        />
    );
};

export default {
    title: 'Button/ToggleButton',
    decorators: [centered],
};
