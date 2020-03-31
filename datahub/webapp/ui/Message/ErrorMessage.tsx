import React from 'react';

import { Message } from './Message';

interface IProps {
    title?: string;
    className?: string;
}

export const ErrorMessage: React.FunctionComponent<IProps> = ({
    title = 'Error',
    className = '',
    children,
}) => (
    <Message type="error" title={title}>
        {children}
    </Message>
);
