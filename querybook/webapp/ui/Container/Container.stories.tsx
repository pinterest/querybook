import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Container } from './Container';

export default {
    title: 'Layout/Container',
    decorators: [centered],
};
export const _Container = () => <Container>Container is Full Height</Container>;
