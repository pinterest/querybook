import React, { useCallback, useState } from 'react';

import { IconButton } from 'ui/Button/IconButton';

import { GitHubIntegration } from './GitHubIntegration';

interface IProps {
    docId: number;
}

export const DataDocGitHubButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);

    const handleOpenGitHubModal = useCallback(() => {
        setIsGitHubModalOpen(true);
    }, []);

    const handleCloseGitHubModal = useCallback(() => {
        setIsGitHubModalOpen(false);
    }, []);

    return (
        <>
            <IconButton
                icon="Github"
                onClick={handleOpenGitHubModal}
                tooltip="Connect to GitHub"
                tooltipPos="left"
                title="GitHub"
            />
            {isGitHubModalOpen && (
                <GitHubIntegration
                    docId={docId}
                    onClose={handleCloseGitHubModal}
                />
            )}
        </>
    );
};
