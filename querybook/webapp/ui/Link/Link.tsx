import { LocationDescriptor } from 'history';
import React, { useCallback } from 'react';
import { Link as LinkImport, LinkProps } from 'react-router-dom';
import styled from 'styled-components';

import { stopPropagation as stopPropagationFunc } from 'lib/utils/noop';

const StyledLink = styled('a')`
    ${({ naturalLink }) =>
        naturalLink &&
        `
        color: var(--color-accent-dark);
        &:hover {
            opacity: 0.9;
        }
        text-decoration: underline;
    `};
`;

function isInternalUrl(url: LocationDescriptor): boolean {
    if (url && typeof url === 'string' && url.length && url[0] === '/') {
        return true;
    } else if (url && typeof url === 'object') {
        return true;
    }

    return false;
}

// ReactRouter's Link's tying thinks that defaultValue can only be string | string[]
// This causes a ts error since defaultValue can also be a number
type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    defaultValue?: string | string[];
};

export interface ILinkProps extends AnchorProps {
    to?: LocationDescriptor;
    onClick?: (to: React.MouseEvent) => any;
    newTab?: boolean;

    className?: string;
    naturalLink?: boolean;
    stopProgation?: boolean;
    contextmenu?: boolean;

    linkProps?: Partial<LinkProps>;
}

const openNewTab = (url: string) => window.open(url);
const openInTab = (url: string) => (window.location.href = url);

export const Link: React.FC<ILinkProps> = ({
    to,
    onClick,
    newTab,
    children,

    naturalLink,
    stopProgation,
    linkProps,
    ...elementProps
}) => {
    const handleClick = useCallback(
        (e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault();
            const isCmdDown = e.metaKey;

            if (onClick) {
                onClick(e);
            } else if (to && typeof to === 'string') {
                if (isCmdDown || newTab) {
                    openNewTab(to);
                } else {
                    openInTab(to);
                }
            }
        },
        [to, onClick, newTab]
    );

    const linkComponent = isInternalUrl(to) ? (
        <LinkImport to={to} {...(elementProps as LinkProps)} {...linkProps}>
            {children}
        </LinkImport>
    ) : (
        <StyledLink
            href={to}
            naturalLink={naturalLink}
            onClick={handleClick}
            {...elementProps}
            {...(newTab
                ? {}
                : { target: '_blank', rel: 'noopener noreferrer' })}
        >
            {children}
        </StyledLink>
    );

    if (stopProgation) {
        return <span onClick={stopPropagationFunc}>{linkComponent}</span>;
    }
    return linkComponent;
};
