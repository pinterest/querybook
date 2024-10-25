import React, { useCallback } from 'react';

import { usePaginatedResource } from 'hooks/usePaginatedResource';
import { GitHubResource, ICommit } from 'resource/github';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { Card } from 'ui/Card/Card';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { Icon } from 'ui/Icon/Icon';
import { Link } from 'ui/Link/Link';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import './GitHub.scss';

interface IProps {
    docId: number;
    linkedDirectory: string | null;
}

export const GitHubVersions: React.FunctionComponent<IProps> = ({
    docId,
    linkedDirectory,
}) => {
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

    const handleRestore = async (commitSha: string, commitMessage: string) => {
        alert('Restore feature not implemented yet');
    };

    if (!linkedDirectory) {
        return (
            <div className="feature-disabled">
                <Icon
                    name="AlertCircle"
                    size={128}
                    color="light"
                    className="feature-disabled-icon"
                />
                <Message
                    message="This feature is currently disabled. Please link your DataDoc in Settings to enable."
                    type="info"
                />
            </div>
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

    return (
        <div className="GitHubVersions">
            <div className="commit-list">
                {commitVersions.map((version) => (
                    <Card key={version.sha} alignLeft className="mb12">
                        <AccentText weight="extra" size="large">
                            {version.commit.message}
                        </AccentText>
                        <div className="mt8">
                            <StyledText color="light">
                                <AccentText weight="bold">Author:</AccentText>{' '}
                                {version.commit.author.name}
                            </StyledText>
                            <StyledText color="light" className="mt4">
                                <AccentText weight="bold">Date:</AccentText>{' '}
                                {new Date(
                                    version.commit.author.date
                                ).toLocaleString()}
                            </StyledText>
                        </div>
                        <div className="commit-actions mt8">
                            <Button>
                                <Link
                                    to={version.html_url}
                                    newTab
                                    className="Button Button--primary"
                                >
                                    View on GitHub
                                </Link>
                            </Button>
                            <AsyncButton
                                onClick={() =>
                                    handleRestore(
                                        version.sha,
                                        version.commit.message
                                    )
                                }
                                className="ml8"
                            >
                                Restore Version
                            </AsyncButton>
                            <Button
                                onClick={() =>
                                    alert('Compare feature not implemented yet')
                                }
                                className="ml8"
                            >
                                Compare
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
            {hasMore && (
                <AsyncButton onClick={fetchMore} className="load-more-button">
                    Load More
                </AsyncButton>
            )}
        </div>
    );
};
