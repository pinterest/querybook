import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Container } from './Container';

export default {
    title: 'Layout/Container',
    decorators: [centered],
};
export const _Container = () => <Container>Container is Full Height</Container>;
