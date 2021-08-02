import React from 'react';

interface IPopoverHoverWrapperProps {
    children: (
        showPopover: boolean,
        anchor: HTMLElement | null
    ) => React.ReactNode;
}

export const PopoverHoverWrapper: React.FC<IPopoverHoverWrapperProps> = ({
    children,
}) => {
    const [hovered, setHovered] = React.useState(false);
    const wrapperRef = React.useRef<HTMLDivElement>();

    return (
        <div
            ref={wrapperRef}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {children(
                hovered && Boolean(wrapperRef.current),
                wrapperRef.current
            )}
        </div>
    );
};
