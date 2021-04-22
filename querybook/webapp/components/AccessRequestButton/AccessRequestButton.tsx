import React, { useState } from 'react';
import { Button } from 'ui/Button/Button';

export const AccessRequestButton: React.FunctionComponent<{
    onAccessRequest: () => any;
    isEdit?: boolean;
}> = ({ onAccessRequest, isEdit = false }) => {
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
                    Request{isEdit ? ' Edit' : ''} Access
                </Button>
            )}
        </div>
    );
};
