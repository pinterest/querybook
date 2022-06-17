import clsx from 'clsx';
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
    const keyContentDisplayClassName = clsx({
        'KeyContentDisplay-content': true,
        'right-align': rightAlign,
    });

    return (
        <div className="KeyContentDisplay">
            <div className="KeyContentDisplay-key">
                {titleize(keyString, '_', ' ')}
            </div>
            <div className={keyContentDisplayClassName}>{children}</div>
        </div>
    );
};
