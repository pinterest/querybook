import centered from '@storybook/addon-centered/react';
import React, { useState } from 'react';

import { DebouncedInput } from './DebouncedInput';
import { DebouncedPasswordInput } from './DebouncedPasswordInput';

export default {
    title: 'Form/DebouncedInput',
    decorators: [centered],
};
export const _DebouncedInput = (args) => {
    const [text, setText] = useState('');

    const { password, ...props } = args;

    const InputComponent = password ? DebouncedPasswordInput : DebouncedInput;

    return (
        <>
            <InputComponent
                inputProps={{
                    placeholder: 'placeholder',
                    className: 'input',
                    type: 'text',
                }}
                onChange={setText}
                value={text}
                className="mb8"
                {...props}
            />
        </>
    );
};

_DebouncedInput.args = {
    password: false,
    flex: true,
    transparent: false,
    autoAdjustWidth: false,
};
