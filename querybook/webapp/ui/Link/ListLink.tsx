import * as React from 'react';
import clsx from 'clsx';

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
    children,
    ...listProps
}) => {
    const mergedClassName = clsx({
        ListLink: true,
        [className]: !!className,
        row: isRow,
    });
    return (
        <Link className={mergedClassName} {...listProps}>
            {title ? (
                <span className="ListLinkText">{title}</span>
            ) : placeholder ? (
                <span className="ListLinkPlaceholder">{placeholder}</span>
            ) : null}
            {icon && <Icon name={icon} />}
            {children}
        </Link>
    );
};
