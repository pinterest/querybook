import * as React from 'react';
import clsx from 'clsx';

import { Icon } from 'ui/Icon/Icon';
import type { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Link, ILinkProps } from './Link';

import './ListLink.scss';
import { StyledText, UntitledText } from 'ui/StyledText/StyledText';

interface IProps extends ILinkProps {
    className?: string;
    title?: string;
    noPlaceHolder?: boolean;
    icon?: AllLucideIconNames;
    isRow?: boolean;
}

export const ListLink: React.FunctionComponent<IProps> = React.memo(
    ({
        className,
        title,
        icon,
        isRow,
        noPlaceHolder = false,
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
                    <StyledText className="ListLinkText" size="small">
                        {title}
                    </StyledText>
                ) : noPlaceHolder ? null : (
                    <UntitledText size="small" />
                )}
                {icon && <Icon name={icon} size={16} />}
                {children}
            </Link>
        );
    }
);
