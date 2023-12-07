import { useCallback } from 'react';

export function useResizeToCollapseSidebar(
    defaultWidth: number,
    gapPercentage: number,
    onCollapse: () => void
) {
    return useCallback(
        (event: Event, direction: string, elementRef) => {
            if (
                direction === 'right' &&
                elementRef.clientWidth === defaultWidth
            ) {
                const sidebarRect = elementRef.getBoundingClientRect();
                // this checks if mouse cursor is defaultWidth * gapPercentage left of sidebar
                if (
                    event instanceof MouseEvent &&
                    sidebarRect.left + sidebarRect.width - event.clientX >
                        defaultWidth * gapPercentage
                ) {
                    onCollapse();
                }
            }
        },
        [defaultWidth, gapPercentage, onCollapse]
    );
}
