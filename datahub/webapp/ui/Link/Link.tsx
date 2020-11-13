import React from 'react';
import { LocationDescriptor } from 'history';
import styled from 'styled-components';
import { Link as LinkImport, LinkProps } from 'react-router-dom';

const StyledLink = styled('a')`
    ${({ naturalLink }) =>
        naturalLink &&
        `
        color: inherit;
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

export interface ILinkProps {
    to?: LocationDescriptor;
    onClick?: (to: React.MouseEvent) => any;
    newTab?: boolean;

    className?: string;
    naturalLink?: boolean;
    stopProgation?: boolean;

    linkProps?: Partial<LinkProps>;
}

const openNewTab = (url: string) => window.open(url);
const openInTab = (url: string) => (window.location.href = url);

export class Link extends React.PureComponent<ILinkProps> {
    public handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        const { to, onClick, newTab } = this.props;
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
    };

    public render() {
        const {
            children,
            to,
            onClick,
            newTab,
            naturalLink,
            stopProgation,
            linkProps,
            ...elementProps
        } = this.props;

        const linkComponent = isInternalUrl(to) ? (
            <LinkImport to={to} {...elementProps} {...linkProps}>
                {children}
            </LinkImport>
        ) : (
            <StyledLink
                {...elementProps}
                href={to}
                naturalLink={naturalLink}
                onMouseDown={this.handleClick}
            >
                {children}
            </StyledLink>
        );

        if (stopProgation) {
            return (
                <span onClick={(event) => event.stopPropagation()}>
                    {linkComponent}
                </span>
            );
        }
        return linkComponent;
    }
}
