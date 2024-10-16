import React, { useCallback, useEffect, useState } from 'react';

import { GitHubResource } from 'resource/github';
import { IconButton } from 'ui/Button/IconButton';

import { GitHubModal } from './GitHubModal';

interface IProps {
    docId: number;
}

export const DataDocGitHubButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const { data } = await GitHubResource.isAuthenticated();
                setIsAuthenticated(data.is_authenticated);
            } catch (error) {
                console.error(
                    'Failed to check GitHub authentication status:',
                    error
                );
            }
        };

        checkAuthentication();
    }, []);

    const handleOpenModal = useCallback(() => {
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <>
            <IconButton
                icon="Github"
                onClick={handleOpenModal}
                tooltip="Connect to GitHub"
                tooltipPos="left"
                title="GitHub"
            />
            {isModalOpen && (
                <GitHubModal
                    docId={docId}
                    isAuthenticated={isAuthenticated}
                    setIsAuthenticated={setIsAuthenticated}
                    onClose={handleCloseModal}
                />
            )}
        </>
    );
};
