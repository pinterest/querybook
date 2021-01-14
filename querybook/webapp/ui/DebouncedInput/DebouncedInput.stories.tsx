import React, { useState } from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { DebouncedInput } from './DebouncedInput';

export default {
    title: 'Form/DebouncedInput',
    decorators: [centered],
};
export const _DebouncedInput = (args) => {
    const [text, setText] = useState('');

    return (
        <>
            <DebouncedInput
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={setText}
                value={text}
                className="mb8"
                {...args}
            />
        </>
    );
};

_DebouncedInput.args = {
    flex: true,
    transparent: false,
    autoAdjustWidth: false,
};
