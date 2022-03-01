import { useEvent } from 'hooks/useEvent';
import { useMounted } from 'hooks/useMounted';
import React, { useCallback, useRef, useState } from 'react';

export const useContextMenu = (ref: React.RefObject<HTMLElement>) => {
    const contextMenuRef = useRef<HTMLDivElement>();
    const [anchorPoint, setAnchorPoint] = useState({ x: 0, y: 0 });
    const [show, setShow] = useState(false);
    const mounted = useMounted();

    const hide = useCallback(() => setShow(false), []);

    const handleContextMenu = useCallback((event: MouseEvent) => {
        event.preventDefault();
        setAnchorPoint({ x: event.pageX, y: event.pageY });
        setShow(true);
    }, []);

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            if (!event.composedPath().includes(contextMenuRef.current)) {
                hide();
            }
        },
        [hide]
    );

    useEvent(
        'contextmenu',
        handleContextMenu,
        false,
        ref.current,
        !(mounted && ref.current != null)
    );
    useEvent('mousedown', handleClickOutside, false, document, !show);

    return { anchorPoint, show, contextMenuRef, hide };
};
