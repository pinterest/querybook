import React, { useState } from 'react';

import { Button } from 'ui/Button/Button';

import './AccessRequestButton.scss';

export const AccessRequestButton: React.FunctionComponent<{
    onAccessRequest: () => any;
    isEdit?: boolean;
}> = ({ onAccessRequest, isEdit = false }) => {
    const [accessRequsted, setAccessRequested] = useState(false);
    return (
        <div className="AccessRequestButton">
            {accessRequsted ? (
                <div className="success-message">'Access Request Sent!'</div>
            ) : (
                <Button
                    onClick={() => {
                        onAccessRequest();
                        setAccessRequested(true);
                    }}
                    pushable
                    title={`Request${isEdit ? ' Edit' : ''} Access`}
                />
            )}
        </div>
    );
};
