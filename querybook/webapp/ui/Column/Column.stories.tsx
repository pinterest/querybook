import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

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
