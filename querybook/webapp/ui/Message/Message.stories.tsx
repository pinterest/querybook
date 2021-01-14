import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import centered from '@storybook/addon-centered/react';

import { Message } from './Message';

export const _Message = () => (
    <>
        <Message
            title="Info Message"
            message="Info Message with Icon"
            icon="heart"
            iconSize={16}
            type="info"
        />
        <Message
            title="Error Message"
            message="Error Message with Icon"
            icon="frown"
            iconSize={16}
            type="error"
        />
        <Message
            title="Warning Message"
            message="Warning Message with Icon"
            icon="check"
            iconSize={16}
            type="warning"
        />
        <Message
            title="Success Message"
            message="Success Message with Icon"
            icon="award"
            iconSize={16}
            type="success"
        />
        <Message
            title="Tip Message"
            message="Tip Message with Icon"
            icon="check"
            iconSize={16}
            type="tip"
        />
    </>
);

export default {
    title: 'Stateless/Message',
    decorators: [centered],
};
