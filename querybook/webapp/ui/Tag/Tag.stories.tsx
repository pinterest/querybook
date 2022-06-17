import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Tag, TagGroup } from './Tag';

export const _Tag = () => (
    <>
        <TagGroup>
            <Tag>First</Tag>
            <Tag highlighted>Second</Tag>
        </TagGroup>
        <Tag>Tag</Tag>
        <Tag highlighted>Highlighted Tag</Tag>
    </>
);

export default {
    title: 'Stateless/Tag',
    decorators: [centered],
};
