import { copy } from 'lib/utils';
import React, { useCallback, useRef } from 'react';
import { Icon } from 'ui/Icon/Icon';
import { MenuItem, Menu } from 'ui/Menu/Menu';
import { ContextMenu } from './ContextMenu';

interface IUrlContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    url: string;
}

export const UrlContextMenu: React.FC<IUrlContextMenuProps> = ({
    anchorRef,
    url,
}) => {
    const handleUrlOpen = useCallback(() => {
        window.open(url);
    }, [url]);

    const handleUrlCopy = useCallback(() => {
        const isRelative = !url.startsWith('http');

        copy(
            (isRelative ? location.protocol + '//' + location.host : '') + url
        );
    }, [url]);

    const renderMenu = () => (
        <Menu boxShadow>
            <MenuItem onClick={handleUrlOpen}>
                <Icon name="external-link" className="mr4" />
                Open in new tab
            </MenuItem>
            <MenuItem onClick={handleUrlCopy}>
                <Icon name="copy" className="mr4" />
                Copy Url
            </MenuItem>
        </Menu>
    );

    return <ContextMenu anchorRef={anchorRef} renderContextMenu={renderMenu} />;
};

export const UrlContextMenuWrapper: React.FC<
    { url: string } & React.HTMLAttributes<HTMLDivElement>
> = ({ url, children, ...otherProps }) => {
    const selfRef = useRef<HTMLDivElement>();
    return (
        <>
            <div ref={selfRef} {...otherProps}>
                {children}
            </div>
            <UrlContextMenu anchorRef={selfRef} url={url} />
        </>
    );
};
