import React from 'react';
import { Button } from 'ui/Button/Button';
import { useState } from 'react';

export const AccessRequestPage: React.FunctionComponent<{
    onAccessRequest: () => any;
}> = ({ onAccessRequest }) => {
    const [accessRequsted, setAccessRequested] = useState(false);
    return (
        <>
            {accessRequsted ? (
                'Access Request sent!'
            ) : (
                <Button
                    onClick={() => {
                        onAccessRequest();
                        setAccessRequested(true);
                    }}
                    className="request-access-buton"
                    pushable
                >
                    Request Access
                </Button>
            )}
        </>
    );
};
