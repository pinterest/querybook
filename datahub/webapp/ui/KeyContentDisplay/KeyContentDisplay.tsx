import * as React from 'react';
import classNames from 'classnames';

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
    const keyContentDisplayClassName = classNames({
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
