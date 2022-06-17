import centered from '@storybook/addon-centered/react';
import React from 'react';

import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';

import { DisabledSection } from './DisabledSection';

export default {
    title: 'Stateless/DisabledSection',
    decorators: [centered],
};
export const _DisabledSection = () => (
    <DisabledSection>
        <DebouncedInput
            flex
            inputProps={{
                placeholder: 'placeholder',
                className: 'input',
                type: 'text',
            }}
            onChange={() => null}
            value="disabled input"
        />
    </DisabledSection>
);
