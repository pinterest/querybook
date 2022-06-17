import React, { useImperativeHandle } from 'react';

import { useContextMenu } from 'hooks/ui/useContextMenu';
import { Overlay } from 'ui/Overlay/Overlay';

interface IContextMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    renderContextMenu: () => React.ReactNode;
}

export interface IContextMenuHandles {
    hide: () => void;
}

export const ContextMenu = React.forwardRef<
    IContextMenuHandles,
    IContextMenuProps
>(({ anchorRef, renderContextMenu }, ref) => {
    const { anchorPoint, show, contextMenuRef, hide } =
        useContextMenu(anchorRef);

    useImperativeHandle(ref, () => ({
        hide,
    }));

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
});
