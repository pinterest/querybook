import React from 'react';
import { useDebounce } from 'hooks/useDebounce';

interface IPopoverHoverWrapperProps {
    children: (
        showPopover: boolean,
        anchor: HTMLElement | null
    ) => React.ReactNode;
    debounce?: number;
}

export const PopoverHoverWrapper: React.FC<IPopoverHoverWrapperProps> = ({
    children,
    debounce = 750,
}) => {
    const [hovered, setHovered] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>();
    const debouncedHover = useDebounce(hovered, debounce);

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children(
                debouncedHover && Boolean(wrapperRef.current),
                wrapperRef.current
            )}
        </div>
    );
};
