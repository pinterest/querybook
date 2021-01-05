import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

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
