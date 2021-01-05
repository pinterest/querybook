import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Card } from './Card';

export default {
    title: 'Stateless/Card',
    decorators: [centered],
};

export const DefaultCard = ({ ...args }) => (
    <Card {...args}>Default Card Content</Card>
);
DefaultCard.args = {
    title: 'Card',
};

export const FlexRowCard = () => (
    <Card title="Card" flexRow>
        Flex-Row Card Content
    </Card>
);

export const FixedWidthHeightCard = ({ ...args }) => (
    <Card {...args}>Card with Width/Height</Card>
);
FixedWidthHeightCard.args = {
    title: 'Card',
    width: '240px',
    height: '160px',
};
