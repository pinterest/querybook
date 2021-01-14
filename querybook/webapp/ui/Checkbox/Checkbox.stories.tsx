import React, { useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Checkbox } from './Checkbox';

export default {
    title: 'Form/Checkbox',
    decorators: [centered],
};
export const _Checkbox = (args) => {
    const [state, setState] = useState(false);

    return (
        <>
            <Checkbox {...args} onChange={setState} value={state} />
        </>
    );
};

_Checkbox.args = {
    title: 'checkbox',
    disabled: false,
};
