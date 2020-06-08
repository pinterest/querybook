import React from 'react';
import * as classNames from 'classnames';

import history from 'lib/router-history';
import { IDataDoc } from 'const/datadoc';

import { Icon } from 'ui/Icon/Icon';
import { ListLink } from 'ui/Link/ListLink';

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
    const handleClick = React.useCallback(() => {
        if (onDataDocClick) {
            return onDataDocClick();
        }
        history.push(url);
    }, [url, onDataDocClick]);

    const { title = '', public: publicDataDoc } = dataDoc;
    const privateIcon = !publicDataDoc && 'lock';
    const titleText = title || 'Untitled';

    return (
        <ListLink
            className={className}
            onClick={handleClick}
            to={url}
            icon={privateIcon}
            emptyTitle={!title}
            title={titleText}
        />
    );
};
