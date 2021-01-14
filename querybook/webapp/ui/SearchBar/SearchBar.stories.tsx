import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { SearchBar, ISearchBarProps } from './SearchBar';

export const _SearchBar = (args: ISearchBarProps) => {
    const [value, setValue] = React.useState('');
    return (
        <div style={{ width: '240px', alignItems: 'stretch' }}>
            <SearchBar
                {...args}
                value={value}
                onSearch={setValue}
                placeholder="Search Bar"
                className="mb12"
            />
        </div>
    );
};

_SearchBar.args = {
    transparent: false,
    hasIcon: false,
};

export default {
    title: 'Form/SearchBar',
    decorators: [centered],
};
