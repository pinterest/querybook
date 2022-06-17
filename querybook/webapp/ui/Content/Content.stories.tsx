import centered from '@storybook/addon-centered/react';
import React from 'react';

import { Content } from './Content';

export default {
    title: 'Stateless/Content',
    decorators: [centered],
};
export const _Content = () => (
    <Content>
        <h1>Content styles HTML</h1>
        <p>paragraph</p>
        <ul>
            <li>
                <u>list item 1</u>
            </li>
            <li>
                <i>list item 2</i>
            </li>
            <li>
                <b>list item 3</b>
            </li>
        </ul>
        <code>code</code>
    </Content>
);
