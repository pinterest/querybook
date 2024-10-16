import React, { useCallback, useState } from 'react';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { GitHubResource, IGitHubAuthResponse } from 'resource/github';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';

import { GitHubAuth } from './GitHubAuth';

interface IProps {
    docId: number;
    isAuthenticated: boolean;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
    onClose: () => void;
}

export const GitHubModal: React.FunctionComponent<IProps> = ({
    docId,
    isAuthenticated,
    setIsAuthenticated,
    onClose,
}) => {
    const [errorMessage, setErrorMessage] = useState<string>(null);

    const handleConnectGitHub = useCallback(async () => {
        trackClick({
            component: ComponentType.DATADOC_PAGE,
            element: ElementType.GITHUB_CONNECT_BUTTON,
        });

        try {
            const { data }: { data: IGitHubAuthResponse } =
                await GitHubResource.connectGithub();
            const url = data.url;
            if (!url) {
                throw new Error('Failed to get GitHub authentication URL');
            }
            const authWindow = window.open(url);

            const receiveMessage = () => {
                authWindow.close();
                delete window.receiveChildMessage;
                window.removeEventListener('message', receiveMessage, false);
                setIsAuthenticated(true);
            };
            window.receiveChildMessage = receiveMessage;

            // If the user closes the authentication window manually, clean up
            const timer = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(timer);
                    window.removeEventListener(
                        'message',
                        receiveMessage,
                        false
                    );
                    throw new Error('Authentication process failed');
                }
            }, 1000);
        } catch (error) {
            console.error('GitHub authentication failed:', error);
            setErrorMessage('GitHub authentication failed. Please try again.');
        }
    }, [setIsAuthenticated]);

    return (
        <Modal onHide={onClose} title="GitHub Integration">
            <div className="GitHubModal-content">
                {isAuthenticated ? (
                    <Message message="Connected to GitHub!" type="success" />
                ) : (
                    <GitHubAuth onAuthenticate={handleConnectGitHub} />
                )}
                {errorMessage && (
                    <Message message={errorMessage} type="error" />
                )}
                <button onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
};
