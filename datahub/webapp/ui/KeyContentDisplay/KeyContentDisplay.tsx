import * as React from 'react';

import { titleize } from 'lib/utils';

import './KeyContentDisplay.scss';

interface IProps {
    keyString: string;
    rightAlign?: boolean;
}

export const KeyContentDisplay: React.FunctionComponent<IProps> = ({
    keyString,
    children,
    rightAlign,
}) => {
    return (
        <div className="KeyContentDisplay">
            <div className="KeyContentDisplay-key">
                {titleize(keyString, '_', ' ')}
            </div>
            <div
                className={
                    rightAlign
                        ? 'KeyContentDisplay-content right-align'
                        : 'KeyContentDisplay-content'
                }
            >
                {children}
            </div>
        </div>
    );
};
