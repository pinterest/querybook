import React, { useCallback } from 'react';

import { useGlobalState } from 'hooks/redux/useGlobalState';
import { UserResource } from 'resource/user';
import { Title } from 'ui/Title/Title';

export const SessionExpirationNotice: React.FC = () => {
    const [sessionExpired] = useGlobalState('sessionExpired', false);
    const refreshPage = useCallback(() => {
        // Try to logout in case it wasn't shown correctly
        UserResource.logout().finally(() => {
            window.location.reload();
        });
    }, []);
    return sessionExpired ? (
        <div
            className="flex-center"
            onClick={refreshPage}
            style={{
                cursor: 'pointer',
                paddingBottom: '10%',
                paddingTop: '10%',
                backgroundColor: 'var(--bg-invert)',
            }}
        >
            <Title size="xlarge" color="invert">
                Your session has expired. Click HERE to refresh the page.
            </Title>
        </div>
    ) : null;
};
