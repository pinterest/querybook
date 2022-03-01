import { useContextMenu } from 'hooks/ui/useContextMenu';
import React from 'react';
import { Overlay } from 'ui/Overlay/Overlay';

interface IContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    renderContextMenu: () => React.ReactNode;
}

export const ContextMenu: React.FC<IContextMenuProps> = ({
    anchorRef,
    renderContextMenu,
}) => {
    const { anchorPoint, show, contextMenuRef, hide } = useContextMenu(
        anchorRef
    );

    if (!show) {
        return null;
    }

    return (
        <Overlay
            render={() => (
                <div
                    className="ContextMenu"
                    style={{
                        top: anchorPoint.y,
                        left: anchorPoint.x,
                        position: 'fixed',
                        zIndex: 1000,
                    }}
                    ref={contextMenuRef}
                    onClick={hide}
                >
                    {renderContextMenu()}
                </div>
            )}
        />
    );
};
