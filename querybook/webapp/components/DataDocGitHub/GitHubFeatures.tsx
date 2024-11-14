import React, { useCallback, useEffect, useState } from 'react';

import { TooltipDirection } from 'const/tooltip';
import { GitHubResource } from 'resource/github';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { Tabs } from 'ui/Tabs/Tabs';

import { GitHubPush } from './GitHubPush';
import { GitHubSettings } from './GitHubSettings';
import { GitHubVersions } from './GitHubVersions';

interface IProps {
    docId: number;
}

const GITHUB_TABS = [
    {
        key: 'push',
        name: 'Push to GitHub',
        icon: 'GitPullRequest' as const,
        tooltip: 'Push your changes to GitHub',
        tooltipPos: 'up' as TooltipDirection,
    },
    {
        key: 'versions',
        name: 'GitHub Versions',
        icon: 'History' as const,
        tooltip: 'View and manage previous versions',
        tooltipPos: 'up' as TooltipDirection,
    },
    {
        key: 'settings',
        name: 'Settings',
        icon: 'Settings' as const,
        tooltip: 'Configure GitHub integration settings',
        tooltipPos: 'up' as TooltipDirection,
    },
];

type GitHubTabKey = 'push' | 'versions' | 'settings';

export const GitHubFeatures: React.FC<IProps> = ({ docId }) => {
    const [activeTab, setActiveTab] = useState<GitHubTabKey>('push');
    const [linkedDirectory, setLinkedDirectory] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleTabSelect = (key: GitHubTabKey) => {
        setActiveTab(key);
    };

    const fetchLinkedDirectory = useCallback(async () => {
        try {
            const response = await GitHubResource.isGitHubLinked(docId);
            if (response.data.linked_directory) {
                setLinkedDirectory(response.data.linked_directory);
            } else {
                setLinkedDirectory(null);
            }
        } catch (error) {
            console.error('Failed to fetch linked directory:', error);
            setErrorMessage(
                'Failed to fetch linked directory. Please try again.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [docId]);

    useEffect(() => {
        fetchLinkedDirectory();
    }, [fetchLinkedDirectory]);

    const handleLinkDirectory = useCallback(
        async (directory: string) => {
            try {
                const linkResponse = await GitHubResource.linkGitHub(
                    docId,
                    directory
                );
                setLinkedDirectory(linkResponse.data.directory);
                setErrorMessage(null);
            } catch (error) {
                console.error('Failed to link directory:', error);
                setErrorMessage('Failed to link directory. Please try again.');
            }
        },
        [docId]
    );

    if (isLoading) {
        return <Loading text="Loading GitHub features..." />;
    }

    const directoryMessage = (
        <Message
            message={
                linkedDirectory
                    ? `Currently linked to the "${linkedDirectory}" directory. To change the directory, go to the Settings tab. This directory will be used for DataDoc commits and version history.`
                    : `Your DataDoc is not linked to GitHub. Please navigate to the Settings tab to link it before using GitHub push and version history features.`
            }
            type={linkedDirectory ? 'info' : 'warning'}
            size="large"
            icon={linkedDirectory ? 'Info' : 'AlertTriangle'}
            iconSize={linkedDirectory ? 16 : 20}
            className="mt12"
            center
        />
    );

    return (
        <div className="GitHubFeatures">
            <Tabs
                selectedTabKey={activeTab}
                items={GITHUB_TABS}
                onSelect={handleTabSelect}
                pills
                wide
                size="large"
                selectColor
                className="github-tab-item mb12"
            />
            {activeTab === 'push' && (
                <div>
                    {directoryMessage}
                    <GitHubPush
                        docId={docId}
                        linkedDirectory={linkedDirectory}
                    />
                </div>
            )}
            {activeTab === 'versions' && (
                <div>
                    {directoryMessage}
                    <GitHubVersions
                        docId={docId}
                        linkedDirectory={linkedDirectory}
                    />
                </div>
            )}
            {activeTab === 'settings' && (
                <GitHubSettings
                    docId={docId}
                    linkedDirectory={linkedDirectory}
                    onLinkDirectory={handleLinkDirectory}
                />
            )}
            {errorMessage && (
                <Message
                    message={errorMessage}
                    type="error"
                    icon="XCircle"
                    iconSize={20}
                    className="mt12"
                    center
                />
            )}
        </div>
    );
};
