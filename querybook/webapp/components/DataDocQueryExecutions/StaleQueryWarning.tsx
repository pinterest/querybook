import React from 'react';

import { TextButton } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';

interface IProps {
    onRevert?: () => void;
}

export const StaleQueryWarning: React.FC<IProps> = ({ onRevert }) => (
    <Message
        type="warning"
        icon="AlertTriangle"
        iconSize={16}
        size="small"
        message={
            <span className="flex-row" style={{ gap: 8 }}>
                Query has been edited.
                {onRevert && (
                    <TextButton
                        icon="RotateCcw"
                        title="Revert"
                        size="small"
                        onClick={onRevert}
                    />
                )}
            </span>
        }
    />
);
