import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Column, Columns } from './Column';

export default {
    title: 'Layout/Column',
    decorators: [centered],
};
export const _Column = () => (
    <Columns>
        <Column>First Column</Column>
        <Column>Second Column</Column>
        <Column>Third Column</Column>
    </Columns>
);
