import * as React from 'react';

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
            <div className="KeyContentDisplay-key">{keyString}</div>
            <div className="KeyContentDisplay-content">{content}</div>
        </div>
    );
};
