import * as React from 'react';

import { titleize } from 'lib/utils';

interface IProps {
    keyString: string;
    content: any;
}

import './KeyContentDisplay.scss';

export const KeyContentDisplay: React.FunctionComponent<IProps> = ({
    keyString,
    content,
}) => {
    console.log(keyString);
    return (
        <div className="KeyContentDisplay">
            <div className="KeyContentDisplay-key">{titleize(keyString)}</div>
            <div className="KeyContentDisplay-content">{content}</div>
        </div>
    );
};
