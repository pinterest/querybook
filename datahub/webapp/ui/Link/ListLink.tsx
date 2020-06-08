import * as React from 'react';
import classNames from 'classnames';

import { Icon } from 'ui/Icon/Icon';
import { Link, ILinkProps } from './Link';

import './ListLink.scss';

interface IProps extends ILinkProps {
    className?: string;
    title?: string;
    icon?: string;
    isRow?: boolean;
    emptyTitle?: boolean;
}

export const ListLink: React.FunctionComponent<IProps> = ({
    className,
    onClick,
    title,
    to,
    icon,
    isRow,
    emptyTitle,
}) => {
    const mergedClassName = classNames({
        ListLink: true,
        [className]: !!className,
        row: isRow,
        'empty-title': emptyTitle,
    });
    return (
        <Link className={mergedClassName} onClick={onClick} to={to}>
            <span className="ListLinkText">{title}</span>
            {icon && <Icon name={icon} />}
        </Link>
    );
};
