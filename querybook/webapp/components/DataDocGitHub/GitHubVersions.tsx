import React, { useCallback, useState } from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ComponentType, ElementType } from 'const/analytics';
import { useRestoreDataDoc } from 'hooks/dataDoc/useRestoreDataDoc';
import { usePaginatedResource } from 'hooks/usePaginatedResource';
import { useResource } from 'hooks/useResource';
import { trackClick } from 'lib/analytics';
import { GitHubResource, ICommit } from 'resource/github';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { IconButton } from 'ui/Button/IconButton';
import { FeatureDisabledMessage } from 'ui/DisabledSection/FeatureDisabledMessage';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { Link } from 'ui/Link/Link';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';

import { CommitCard } from './CommitCard';

import './GitHub.scss';

interface IProps {
    docId: number;
    linkedDirectory: string | null;
}

export const GitHubVersions: React.FunctionComponent<IProps> = ({
    docId,
    linkedDirectory,
}) => {
    const [isCompareOpen, setIsCompareOpen] = useState(false);
    const [selectedCommit, setSelectedCommit] = useState<ICommit | null>(null);
    const [isFullScreen, setIsFullScreen] = useState(false);

    const {
        data: commitVersions,
        isLoading,
        isError,
        fetchMore,
        hasMore,
    } = usePaginatedResource<ICommit>(
        useCallback(
            (limit, offset) =>
                GitHubResource.getDataDocVersions(docId, limit, offset),
            [docId]
        ),
        { batchSize: 5 }
    );

    const {
        data: comparisonData,
        isLoading: isComparisonLoading,
        isError: isComparisonError,
    } = useResource(
        React.useCallback(() => {
            if (selectedCommit) {
                return GitHubResource.compareDataDocVersions(
                    docId,
                    selectedCommit.sha
                );
            }
        }, [docId, selectedCommit]),
        {
            fetchOnMount: !!selectedCommit,
        }
    );

    const restoreDataDoc = useRestoreDataDoc();

    const handleRestore = useCallback(
        async (commit: ICommit) => {
            const commitId = commit.sha;
            const commitMessage = commit.commit.message;
            await restoreDataDoc(docId, commitId, commitMessage);
        },
        [docId, restoreDataDoc]
    );

    const toggleCompare = useCallback(
        (version?: ICommit) => {
            if (version) {
                if (isCompareOpen && selectedCommit?.sha === version.sha) {
                    setIsCompareOpen(false);
                    setSelectedCommit(null);
                    setIsFullScreen(false);
                } else {
                    setSelectedCommit(version);
                    setIsCompareOpen(true);
                }
            } else {
                setIsCompareOpen(false);
                setSelectedCommit(null);
                setIsFullScreen(false);
            }
        },
        [isCompareOpen, selectedCommit]
    );

    const toggleFullScreen = useCallback(() => {
        if (!isFullScreen) {
            trackClick({
                component: ComponentType.GITHUB,
                element: ElementType.GITHUB_COMPARE_FULLSCREEN_BUTTON,
            });
        }
        setIsFullScreen((prev) => !prev);
    }, [isFullScreen]);

    if (!linkedDirectory) {
        return (
            <FeatureDisabledMessage message="This feature is currently disabled. Please link your DataDoc in Settings to enable." />
        );
    }

    if (isLoading) {
        return (
            <div className="loading-container">
                <Loading />
                <div className="loading-message">Loading versions...</div>
            </div>
        );
    }

    if (isError) {
        return (
            <ErrorPage
                errorTitle="Failed to Load Versions"
                errorMessage="There was an error loading the versions. Please try again later."
            />
        );
    }

    if (commitVersions.length === 0) {
        return (
            <div className="no-versions">
                <Message
                    message="No previous versions found for this DataDoc."
                    type="info"
                />
            </div>
        );
    }

    const commitListDOM = (
        <div className="commit-list  mt16 pr12">
            {commitVersions.map((version) => (
                <CommitCard
                    key={version.sha}
                    version={version}
                    onRestore={handleRestore}
                    onCompare={toggleCompare}
                />
            ))}
        </div>
    );

    const loadMoreButtonDOM = hasMore ? (
        <AsyncButton onClick={fetchMore} className="mt12 mb16">
            Load More
        </AsyncButton>
    ) : null;

    const comparePanelDOM = (
        <div
            className={`compare-slide-out-panel ${
                isCompareOpen ? 'open' : ''
            } ${isFullScreen ? 'full-screen' : ''}`}
        >
            {selectedCommit && (
                <div className="GitHubVersionsComparePanel">
                    <div className="panel-header">
                        <Link to={selectedCommit.html_url} newTab>
                            <IconButton
                                icon={'Info'}
                                size={16}
                                tooltip={
                                    'Compare the current DataDoc with the selected commit. For a more detailed view of changes, please view it on GitHub.'
                                }
                                tooltipPos="left"
                                className="tooltip"
                            />
                        </Link>
                        <IconButton
                            icon={isFullScreen ? 'Minimize2' : 'Maximize2'}
                            onClick={toggleFullScreen}
                            size={16}
                            tooltip={
                                isFullScreen
                                    ? 'Exit Full Screen'
                                    : 'Enter Full Screen'
                            }
                            tooltipPos="left"
                        />
                        <IconButton
                            icon="X"
                            onClick={() => toggleCompare()}
                            size={16}
                            tooltip="Close Compare Panel"
                            tooltipPos="left"
                        />
                    </div>
                    {isComparisonLoading ? (
                        <Loading />
                    ) : isComparisonError || !comparisonData ? (
                        <Message
                            message="Failed to load comparison. Please try again."
                            type="error"
                            icon="AlertTriangle"
                            iconSize={16}
                        />
                    ) : (
                        <QueryComparison
                            fromQuery={comparisonData?.commit_content}
                            toQuery={comparisonData?.current_content}
                            fromQueryTitle={`Commit: ${selectedCommit.commit.message}`}
                            toQueryTitle="Current DataDoc"
                        />
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="GitHubVersions">
            <div className="commit-list-wrapper">
                {commitListDOM}
                {loadMoreButtonDOM}
                {comparePanelDOM}
            </div>
        </div>
    );
};
