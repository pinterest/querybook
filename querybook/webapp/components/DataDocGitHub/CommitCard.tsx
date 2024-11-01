import React from 'react';

import { ICommit } from 'resource/github';
import { AsyncButton } from 'ui/AsyncButton/AsyncButton';
import { Button } from 'ui/Button/Button';
import { Card } from 'ui/Card/Card';
import { Link } from 'ui/Link/Link';
import { AccentText, StyledText } from 'ui/StyledText/StyledText';

import './GitHub.scss';

interface IProps {
    version: ICommit;
    onRestore: (sha: string, message: string) => void;
    onCompare: (version: ICommit) => void;
}

export const CommitCard: React.FC<IProps> = ({
    version,
    onRestore,
    onCompare,
}) => (
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
                {new Date(version.commit.author.date).toLocaleString()}
            </StyledText>
        </div>
        <div className="commit-actions mt8">
            <Button pushable>
                <Link to={version.html_url} newTab>
                    View on GitHub
                </Link>
            </Button>
            <AsyncButton
                onClick={async () =>
                    onRestore(version.sha, version.commit.message)
                }
                className="ml8"
                title="Restore Version"
                hoverColor="var(--color-accent-dark)"
                pushable
            />
            <Button
                onClick={() => onCompare(version)}
                className="ml8"
                title="Compare"
                hoverColor="var(--color-accent-dark)"
                pushable
            />
        </div>
    </Card>
);
