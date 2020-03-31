import React from 'react';
import * as classNames from 'classnames';

import history from 'lib/router-history';
import { IDataDoc } from 'const/datadoc';

import { Link } from 'ui/Link/Link';
import { Icon } from 'ui/Icon/Icon';

export interface IDataDocGridItemProps {
    dataDoc: IDataDoc;
    className: string;
    pinned?: boolean;
    url?: string;
    onDataDocClick?: () => any;
    onDeleteDataDocClick?: () => any;
    onFavoriteDataDocClick?: () => any;
}

export const DataDocGridItem: React.FunctionComponent<IDataDocGridItemProps> = ({
    dataDoc,
    className,
    url,
    onDataDocClick,
}) => {
    const mergedClassName = classNames({
        [className]: !!className,
        DataDocGridItem: true,
    });

    const { title = '', public: publicDataDoc } = dataDoc;
    const handleClick = React.useCallback(() => {
        if (onDataDocClick) {
            return onDataDocClick();
        }
        history.push(url);
    }, [url, onDataDocClick]);

    const privateIcon = !publicDataDoc && <Icon name="lock" size={14} />;

    const titleText = title || 'Untitled';
    const titleDOM = (
        <span
            className={classNames({
                'analysis-title': true,
                'empty-title': !title,
            })}
        >
            {titleText}
        </span>
    );

    return (
        <Link className={mergedClassName} onClick={handleClick} to={url}>
            {titleDOM}
            {privateIcon}
        </Link>
    );
};
