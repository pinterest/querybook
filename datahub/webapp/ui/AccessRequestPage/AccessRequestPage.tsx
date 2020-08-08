import React from 'react';
import { Button } from 'ui/Button/Button';
import { useState } from 'react';
import './AccessRequestPage.scss';

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
                >
                    Request Access
                </Button>
            )}
        </>
    );
};
