import React, { useCallback, useEffect, useState } from 'react';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { GitHubResource, IGitHubAuthResponse } from 'resource/github';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';

import { GitHubAuth } from './GitHubAuth';
import { GitHubFeatures } from './GitHubFeatures';

interface IProps {
    docId: number;
    onClose: () => void;
}

export const GitHubIntegration: React.FC<IProps> = ({ docId, onClose }) => {
    const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const authResponse = await GitHubResource.isAuthorized();
                setIsAuthorized(authResponse.data.is_authorized);
            } catch (error) {
                console.error('Failed to check GitHub status:', error);
                setErrorMessage(
                    'Failed to check GitHub status. Please try again.'
                );
            } finally {
                setIsLoading(false);
            }
        };

        checkStatus();
    }, [docId]);

    const handleAuthorizeGitHub = useCallback(async () => {
        trackClick({
            component: ComponentType.GITHUB,
            element: ElementType.GITHUB_CONNECT_BUTTON,
        });

        try {
            const { data }: { data: IGitHubAuthResponse } =
                await GitHubResource.authorizeGitHub();
            const url = data.url;
            if (!url) {
                throw new Error('Failed to get GitHub authorization URL');
            }
            const authWindow = window.open(url);

            const receiveMessage = () => {
                authWindow.close();
                delete window.receiveChildMessage;
                window.removeEventListener('message', receiveMessage, false);
                setIsAuthorized(true);
            };
            window.receiveChildMessage = receiveMessage;
        } catch (error) {
            console.error('GitHub authorization failed:', error);
            setErrorMessage('GitHub authorization failed. Please try again.');
            setIsAuthorized(false);
        }
    }, []);

    return (
        <Modal
            onHide={onClose}
            title="GitHub Integration"
            className="GitHubIntegration"
        >
            {isLoading ? (
                <Loading fullHeight text="Loading, please wait..." />
            ) : !isAuthorized ? (
                <GitHubAuth onAuthorize={handleAuthorizeGitHub} />
            ) : (
                <GitHubFeatures docId={docId} />
            )}
            {errorMessage && <Message message={errorMessage} type="error" />}
        </Modal>
    );
};
