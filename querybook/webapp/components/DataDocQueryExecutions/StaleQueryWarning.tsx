import React from 'react';

import { Message } from 'ui/Message/Message';

export const StaleQueryWarning: React.FC = () => (
    <Message
        type="warning"
        icon="AlertTriangle"
        iconSize={16}
        size="small"
        message="Query has been modified."
    />
);
