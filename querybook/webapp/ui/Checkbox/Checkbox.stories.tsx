import centered from '@storybook/addon-centered/react';
import React, { useState } from 'react';

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
