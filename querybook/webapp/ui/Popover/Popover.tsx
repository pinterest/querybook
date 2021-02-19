import React, { useState } from 'react';
import classNames from 'classnames';
import { Overlay, overlayRoot } from 'ui/Overlay/Overlay';

import './Popover.scss';

export type PopoverDirection = 'left' | 'right' | 'top' | 'bottom';
export type PopoverLayout =
    | [PopoverDirection, PopoverDirection]
    | [PopoverDirection];

export interface IPopoverProps {
    // View
    anchor?: HTMLElement; // If anchor is supplied, anchorBox will be auto calculated
    anchorBox?: ClientRect; // If anchorBox is supplied, we will ignore anchor

    layout?: PopoverLayout;
    // Controller
    onHide: () => any;

    hideArrow?: boolean;
    resizeOnChange?: boolean;
    skipAnimation?: boolean;

    // Included because of a typescript bug
    // for react.forwardRef
    children?: React.ReactNode;
}

interface IPopoverContainerProps extends IPopoverProps {
    container: HTMLDivElement;
}

function middle(position: number, length: number) {
    return position + length / 2;
}

const ARROW_SIZE = 10;

export const Popover = React.forwardRef<HTMLDivElement, IPopoverProps>(
    (props, ref) => (
        <Overlay
            render={(el) => (
                <PopoverContainer {...props} container={el} ref={ref} />
            )}
        />
    )
);

const initialArrowStyle: React.CSSProperties = {
    top: 0,
    left: 0,
};
const initialWrapperStyle: React.CSSProperties = {
    top: 0,
    left: 0,
};

const defaultLayout = ['right', 'right'];

export const PopoverContainer = React.forwardRef<
    HTMLDivElement,
    IPopoverContainerProps
>(
    (
        {
            layout = defaultLayout,

            onHide,
            container,
            anchorBox,
            anchor,

            hideArrow,
            resizeOnChange,
            skipAnimation,

            children,
        },
        ref
    ) => {
        const [mainLayout, subLayout] = layout;
        const wrapperElement = React.useRef<HTMLDivElement>(null);

        // Behavior related to clicking outside
        // Note: this fails if the popover contains a react portal
        // that is not using overlayRoot
        const onDocumentClick = React.useCallback(
            (event) => {
                if (!event.composedPath().includes(container)) {
                    // Here we pass the event so the parent can manage focus.
                    // We only dismiss the last child

                    if (container === overlayRoot.lastElementChild) {
                        onHide();
                    }
                }
            },
            [onHide, container, wrapperElement.current]
        );
        React.useEffect(() => {
            document.addEventListener('mousedown', onDocumentClick);
            return () =>
                document.removeEventListener('mousedown', onDocumentClick);
        }, [onDocumentClick]);

        // Behaivor related to resizing event
        const [resizeVersion, setResizeVersion] = useState(0);
        useMutationObserver(
            resizeOnChange,
            () => setResizeVersion((v) => v + 1),
            wrapperElement.current
        );

        // Popover position calculation code
        const [wrapperStyle, setWrapperStyle] = React.useState(
            initialWrapperStyle
        );
        const [arrowStyle, setArrowStyle] = React.useState(initialArrowStyle);
        React.useEffect(() => {
            const newArrowStyle = { ...initialArrowStyle };
            const newWrapperStyle = { ...initialWrapperStyle };

            const box = anchorBox
                ? anchorBox
                : anchor
                ? anchor.getBoundingClientRect()
                : null;
            if (!box) {
                return;
            }

            const contentBox = wrapperElement.current.getBoundingClientRect();

            let arrowRotation = 0;
            const arrowSize = hideArrow ? 0 : ARROW_SIZE;

            if (mainLayout === 'top') {
                newWrapperStyle.top = box.top - contentBox.height - arrowSize;

                arrowRotation = 180;
                newArrowStyle.top = contentBox.height;

                if (subLayout === 'left') {
                    newWrapperStyle.left = box.left;
                    newArrowStyle.left = middle(0, box.width) - ARROW_SIZE;
                } else if (subLayout === 'right') {
                    newWrapperStyle.left =
                        box.left + box.width - contentBox.width;
                    newArrowStyle.left = contentBox.width - 3 * ARROW_SIZE;
                } else {
                    newWrapperStyle.left =
                        middle(box.left, box.width) -
                        middle(0, contentBox.width);
                    newArrowStyle.left =
                        middle(0, contentBox.width) - ARROW_SIZE;
                }
            } else if (mainLayout === 'bottom') {
                newWrapperStyle.top = box.bottom + arrowSize;
                newWrapperStyle.left =
                    middle(box.left, box.width) - middle(0, contentBox.width);

                newArrowStyle.top = -(2 * ARROW_SIZE);

                if (subLayout === 'left') {
                    newWrapperStyle.left = box.left;
                    newArrowStyle.left = ARROW_SIZE;
                } else if (subLayout === 'right') {
                    newWrapperStyle.left =
                        box.left + box.width - contentBox.width;
                    newArrowStyle.left = contentBox.width - 3 * ARROW_SIZE;
                } else {
                    newWrapperStyle.left =
                        middle(box.left, box.width) -
                        middle(0, contentBox.width);
                    newArrowStyle.left =
                        middle(0, contentBox.width) - ARROW_SIZE;
                }
            } else if (mainLayout === 'left') {
                newWrapperStyle.left = box.left - contentBox.width - arrowSize;
                newArrowStyle.left = contentBox.width - 4;
                arrowRotation = 90;

                if (subLayout === 'top') {
                    newWrapperStyle.top = box.top;
                    newArrowStyle.top = middle(0, box.height) - ARROW_SIZE;
                } else if (subLayout === 'bottom') {
                    newWrapperStyle.top =
                        box.top + box.height - contentBox.height;
                    newArrowStyle.top =
                        contentBox.height - middle(0, box.height) - ARROW_SIZE;
                } else {
                    newWrapperStyle.top =
                        middle(box.top, box.height) -
                        middle(0, contentBox.height);
                    newArrowStyle.top =
                        middle(0, contentBox.height) - ARROW_SIZE;
                }
            } else if (mainLayout === 'right') {
                newWrapperStyle.left = box.left + box.width + arrowSize;
                newArrowStyle.left = -25;
                arrowRotation = 270;

                if (subLayout === 'top') {
                    newWrapperStyle.top = box.top;
                    newArrowStyle.top = middle(0, box.height) - ARROW_SIZE;
                } else if (subLayout === 'bottom') {
                    newWrapperStyle.top =
                        box.top + box.height - contentBox.height;
                    newArrowStyle.top =
                        contentBox.height - middle(0, box.height) - ARROW_SIZE;
                } else {
                    newWrapperStyle.top =
                        middle(box.top, box.height) -
                        middle(0, contentBox.height);
                    newArrowStyle.top =
                        middle(0, contentBox.height) - ARROW_SIZE;
                }
            }

            newArrowStyle.transform = `rotate(${arrowRotation}deg)`;

            setArrowStyle(newArrowStyle);
            setWrapperStyle(newWrapperStyle);
        }, [
            mainLayout,
            subLayout,
            anchorBox,
            anchor,
            hideArrow,
            wrapperElement.current,
            resizeVersion,
        ]);

        const arrowDOM = hideArrow ? null : (
            <div className="arrow" style={arrowStyle} />
        );

        return (
            <div className={'Popover '} ref={ref}>
                <div
                    className={classNames({
                        'popover-wrapper': true,
                        'animate-popover': !skipAnimation,
                    })}
                    style={wrapperStyle}
                    ref={wrapperElement}
                >
                    {arrowDOM}
                    <div className={'popover-content'}>{children}</div>
                </div>
            </div>
        );
    }
);

function useMutationObserver(
    active: boolean,
    callback: MutationCallback,
    node: Node
) {
    React.useEffect(() => {
        let mutationObserver: MutationObserver;
        if (active && node) {
            mutationObserver = new MutationObserver(callback);
            mutationObserver.observe(node, {
                attributes: true,
                childList: true,
                subtree: true,
            });
        }
        return () => {
            if (mutationObserver) {
                mutationObserver.disconnect();
            }
        };
    }, [node]);
}
