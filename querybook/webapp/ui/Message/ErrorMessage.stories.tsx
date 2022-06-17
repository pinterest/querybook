import centered from '@storybook/addon-centered/react';
import React from 'react';

import { ErrorMessage } from './ErrorMessage';

export const _ErrorMessage = () => (
    <>
        <ErrorMessage>Error Message</ErrorMessage>
    </>
);

export default {
    title: 'Stateless/ErrorMessage',
    decorators: [centered],
};
