import React, { useState } from 'react';
import { Button } from 'ui/Button/Button';

export const AccessRequestButton: React.FunctionComponent<{
    onAccessRequest: () => any;
    isEditOnly?: boolean;
}> = ({ onAccessRequest, isEditOnly = false }) => {
    const [accessRequsted, setAccessRequested] = useState(false);
    return (
        <div className="AccessRequestButton">
            {accessRequsted ? (
                'Access Request Sent!'
            ) : (
                <Button
                    onClick={() => {
                        onAccessRequest();
                        setAccessRequested(true);
                    }}
                    pushable
                >
                    Request{isEditOnly ? ' Edit' : ''} Access
                </Button>
            )}
        </div>
    );
};
