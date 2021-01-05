import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Loading, LoadingIcon, LoadingRow } from './Loading';

export const _Loading = () => (
    <div>
        <Loading />
    </div>
);
export const _LoadingIcon = () => <LoadingIcon />;

export const _LoadingRow = () => <LoadingRow />;

export default {
    title: 'Stateless/Loading',
    decorators: [centered],
};
