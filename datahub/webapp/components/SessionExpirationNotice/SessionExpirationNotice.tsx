import React, { useCallback } from 'react';
import { useGlobalState } from 'hooks/redux/useGlobalState';
import { Title } from 'ui/Title/Title';

export const SessionExpirationNotice: React.FC = () => {
    const [sessionExpired] = useGlobalState('sessionExpired', false);
    const refreshPage = useCallback(() => window.location.reload(), []);
    return sessionExpired ? (
        <div
            className="flex-center"
            onClick={refreshPage}
            style={{
                cursor: 'pointer',
                paddingBottom: '10%',
                paddingTop: '10%',
                backgroundColor: 'var(--invert-bg-color)',
            }}
        >
            <Title size={3} color={'var(--invert-text-color)'}>
                Your session has expired. Click HERE to refresh the page.
            </Title>
        </div>
    ) : null;
};
