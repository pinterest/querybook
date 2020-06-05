import * as React from 'react';

import { Icon } from 'ui/Icon/Icon';
import { Link } from './Link';

import './ListLink.scss';
import classNames from 'classnames';

interface IProps {
    className?: string;
    onClick?: () => any;
    to?: string;
    icon?: string;
    isRow?: boolean;
    emptyTitle?: boolean;
}

export const ListLink: React.FunctionComponent<IProps> = ({
    className,
    onClick,
    to,
    icon,
    isRow,
    emptyTitle,
    children,
}) => {
    const mergedClassName = classNames({
        ListLink: true,
        [className]: !!className,
        row: isRow,
        'empty-title': emptyTitle,
    });
    return (
        <Link className={mergedClassName} onClick={onClick} to={to}>
            <span className="ListLinkText">{children}</span>
            {icon && <Icon name={icon} />}
        </Link>
    );
};
