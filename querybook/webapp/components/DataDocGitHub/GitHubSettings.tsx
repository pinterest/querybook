import React from 'react';

import { Card } from 'ui/Card/Card';
import { Icon } from 'ui/Icon/Icon';
import { Link } from 'ui/Link/Link';
import { Message } from 'ui/Message/Message';
import { StyledText } from 'ui/StyledText/StyledText';

import { GitHubDirectory } from './GitHubDirectory';

interface IProps {
    docId: number;
    linkedDirectory?: string | null;
    onLinkDirectory: (directory: string) => Promise<void>;
}

export const GitHubSettings: React.FC<IProps> = ({
    docId,
    linkedDirectory,
    onLinkDirectory,
}) => {
    const authorizationCardDom = (
        <div className="GitHubSettings-section-content">
            <Message
                title="GitHub Authorization"
                type="success"
                icon="CheckCircle"
                iconSize={20}
                size="large"
                center
            >
                <StyledText center>
                    Your GitHub account is successfully authorized. Manage your
                    GitHub authorized OAuth apps{' '}
                    <Link to="https://github.com/settings/applications" newTab>
                        <strong>here</strong>{' '}
                        <Icon name="ExternalLink" size={14} />
                    </Link>
                    .
                </StyledText>
            </Message>
        </div>
    );

    const directoryCardDom = (
        <div className="GitHubSettings-section-content">
            <GitHubDirectory
                docId={docId}
                linkedDirectory={linkedDirectory}
                onLinkDirectory={onLinkDirectory}
            />
        </div>
    );

    return (
        <Card className="GitHubSettings">
            {authorizationCardDom}
            {directoryCardDom}
        </Card>
    );
};
