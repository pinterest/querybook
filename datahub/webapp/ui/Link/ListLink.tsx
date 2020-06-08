import * as React from 'react';
import classNames from 'classnames';

import { Icon } from 'ui/Icon/Icon';
import { Link, ILinkProps } from './Link';

import './ListLink.scss';

interface IProps extends ILinkProps {
    className?: string;
    title?: string;
    placeholder?: string;
    icon?: string;
    isRow?: boolean;
}

export const ListLink: React.FunctionComponent<IProps> = ({
    className,
    title,
    icon,
    isRow,
    placeholder = 'Untitled',
    ...listProps
}) => {
    const mergedClassName = classNames({
        ListLink: true,
        [className]: !!className,
        row: isRow,
    });
    return (
        <Link className={mergedClassName} {...listProps}>
            {title ? (
                <span className="ListLinkText">{title}</span>
            ) : (
                <span className="ListLinkPlaceholder">{placeholder}</span>
            )}
            {icon && <Icon name={icon} />}
        </Link>
    );
};
