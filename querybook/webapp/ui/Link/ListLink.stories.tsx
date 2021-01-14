import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { ListLink } from './ListLink';

export const _ListLink = (args) => {
    const [selectedLink, setSelectedLink] = React.useState(0);

    return (
        <div style={{ width: '160px' }}>
            <ListLink
                {...args}
                className={selectedLink === 0 ? 'selected' : ''}
                onClick={() => setSelectedLink(0)}
                title="List Link 1"
            />
            <ListLink
                {...args}
                className={selectedLink === 1 ? 'selected' : ''}
                onClick={() => setSelectedLink(1)}
                title="List Link 2"
            />
            <ListLink
                {...args}
                className={selectedLink === 2 ? 'selected' : ''}
                onClick={() => setSelectedLink(2)}
                title="List Link 3"
            />
            <ListLink
                {...args}
                className={selectedLink === 3 ? 'selected' : ''}
                onClick={() => setSelectedLink(3)}
            />
        </div>
    );
};

_ListLink.args = {
    icon: 'zap',
    isRow: false,
};

export default {
    title: 'Stateless/ListLink',
    decorators: [centered],
};
