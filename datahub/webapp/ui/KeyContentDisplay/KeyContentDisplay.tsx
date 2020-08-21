import * as React from 'react';

import { titleize } from 'lib/utils';

import './KeyContentDisplay.scss';

interface IProps {
    keyString: string;
}

export const KeyContentDisplay: React.FunctionComponent<IProps> = ({
    keyString,
    children,
}) => {
    return (
        <div className="KeyContentDisplay">
            <div className="KeyContentDisplay-key">{titleize(keyString)}</div>
            <div className="KeyContentDisplay-content">{children}</div>
        </div>
    );
};
