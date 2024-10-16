import React from 'react';

import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';

import './GitHub.scss';

interface IProps {
    onAuthenticate: () => void;
}

export const GitHubAuth: React.FunctionComponent<IProps> = ({
    onAuthenticate,
}) => (
    <div className="GitHubAuth">
        <Icon name="Github" size={64} className="GitHubAuth-icon" />
        <Message
            title="Connect to GitHub"
            message="You currently do not have a GitHub provider linked to your account. Please authenticate to enable GitHub features on Querybook."
            type="info"
            iconSize={32}
        />
        <Button
            onClick={onAuthenticate}
            title="Connect Now"
            color="accent"
            theme="fill"
        />
    </div>
);
