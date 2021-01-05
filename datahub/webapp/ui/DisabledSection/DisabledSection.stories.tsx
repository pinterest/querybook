import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { DisabledSection } from './DisabledSection';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';

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
