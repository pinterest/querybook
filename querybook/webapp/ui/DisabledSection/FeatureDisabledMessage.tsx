import React from 'react';

import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';

interface FeatureDisabledMessageProps {
    message?: string;
}

export const FeatureDisabledMessage: React.FunctionComponent<
    FeatureDisabledMessageProps
> = ({ message = 'This feature is currently disabled.' }) => (
    <div className="feature-disabled">
        <Icon
            name="AlertCircle"
            size={128}
            color="light"
            className="feature-disabled-icon"
        />
        <Message message={message} type="info" />
    </div>
);
