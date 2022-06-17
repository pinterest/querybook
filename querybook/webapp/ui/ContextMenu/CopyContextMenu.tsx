import React, { useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

import { copy } from 'lib/utils';
import { stopPropagationAndDefault } from 'lib/utils/noop';
import { Icon } from 'ui/Icon/Icon';
import { Menu, MenuItem } from 'ui/Menu/Menu';

import { ContextMenu, IContextMenuHandles } from './ContextMenu';

interface ICopyContextMenuProps {
    text: string;
    copyName?: string;
    anchorRef: React.RefObject<HTMLElement>;
}

export const CopyContextMenu: React.FC<ICopyContextMenuProps> = ({
    text,
    anchorRef,
    copyName,
}) => {
    const contextMenuRef = React.useRef<IContextMenuHandles>();
    const handleCopy = useCallback(
        (e: React.MouseEvent<HTMLSpanElement>) => {
            stopPropagationAndDefault(e);
            contextMenuRef.current?.hide();

            copy(text);
            toast.success('Copied');
        },
        [text]
    );

    const renderMenu = () => (
        <Menu boxShadow>
            <MenuItem onClick={handleCopy}>
                <Icon name="Copy" className="mr4" />
                {copyName ?? 'Copy'}
            </MenuItem>
        </Menu>
    );

    return (
        <ContextMenu
            anchorRef={anchorRef}
            ref={contextMenuRef}
            renderContextMenu={renderMenu}
        />
    );
};

export const CopyContextMenuWrapper: React.FC<
    { text: string; copyName?: string } & React.HTMLAttributes<HTMLDivElement>
> = ({ text, copyName, children, ...otherProps }) => {
    const selfRef = useRef<HTMLDivElement>();
    return (
        <>
            <div ref={selfRef} {...otherProps}>
                {children}
            </div>
            <CopyContextMenu
                anchorRef={selfRef}
                text={text}
                copyName={copyName}
            />
        </>
    );
};
