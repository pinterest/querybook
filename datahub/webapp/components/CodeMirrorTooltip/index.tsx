import React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { reduxStore } from 'redux/store';

import { sleep } from 'lib/utils';
import { overlayRoot } from 'ui/Overlay/Overlay';
import {
    CodeMirrorTooltip,
    ICodeMirrorTooltipProps,
} from './CodeMirrorTooltip';

function mountTooltip(
    node: Element,
    props: Omit<ICodeMirrorTooltipProps, 'hide'>,
    hide: () => void,
    direction: 'up' | 'down' = null
) {
    const tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'Codemirror-tooltip-container';
    overlayRoot.appendChild(tooltipContainer);

    const rect = node.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    if (direction == null) {
        // node is at top half of the screen
        // Show tooltip on bottom
        direction = windowHeight / 2 > rect.top ? 'down' : 'up';
    }

    if (direction === 'down') {
        tooltipContainer.style.top = `${rect.bottom}px`;
    } else {
        // up direction
        tooltipContainer.style.bottom = `${windowHeight - rect.top}px`;
    }

    tooltipContainer.style.left = `${rect.left}px`;
    tooltipContainer.style.opacity = '1';

    const mergedProps = {
        ...props,
        ...{
            hide,
        },
    };
    // Init the react stuff
    ReactDOM.render(
        <Provider store={reduxStore}>
            <CodeMirrorTooltip {...mergedProps} />
        </Provider>,
        tooltipContainer
    );

    return tooltipContainer;
}

function unmountTooltip(tooltipContainer: HTMLDivElement) {
    if (!tooltipContainer.parentNode) {
        return;
    }
    ReactDOM.unmountComponentAtNode(tooltipContainer);
    tooltipContainer.parentNode.removeChild(tooltipContainer);
}

function isHovered(e: Element) {
    return e.parentElement.querySelector(':hover') === e;
}

export async function showTooltipFor(
    nodes: Element[],
    props: Omit<ICodeMirrorTooltipProps, 'hide'>,
    onNodeHide?: () => void,
    direction: 'up' | 'down' = null
) {
    // This sleep is needed to put this code in eventpool which allosw
    // the node itself to actually appear in the browser
    await sleep(1);

    if (!nodes.some((node) => isHovered(node))) {
        if (onNodeHide) {
            onNodeHide();
        }
        return;
    }
    const hoveredNode = nodes.find((node) => isHovered(node));
    let tooltip = null;

    const hideTooltip = () => {
        if (tooltip) {
            tooltip.removeEventListener('mouseenter', onMouseEnter);
            tooltip.removeEventListener('mouseleave', onMouseOut);
            unmountTooltip(tooltip);
            tooltip = null;
        }
    };
    let hideTooltipTimeout: number;

    const hideTooltipAndNode = () => {
        nodes.forEach((node) => {
            node.removeEventListener('mouseenter', onMouseEnter);
            node.removeEventListener('mouseleave', onMouseOut);
        });

        hideTooltip();
        if (onNodeHide) {
            onNodeHide();
        }
    };

    const onMouseOut = () => {
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
        }
        hideTooltipTimeout = setTimeout(hideTooltipAndNode, 300);
    };

    const onMouseEnter = () => {
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
            hideTooltipTimeout = null;
        }
    };

    tooltip = mountTooltip(hoveredNode, props, hideTooltipAndNode, direction);

    tooltip.addEventListener('mouseenter', onMouseEnter);
    tooltip.addEventListener('mouseleave', onMouseOut);

    const poll = setInterval(() => {
        if (tooltip) {
            // if node no longer exists in body, remove both
            let n: Node & ParentNode = hoveredNode;
            while (true) {
                if (n === document.body) {
                    break;
                }

                if (!n) {
                    // no parent
                    hideTooltipAndNode();
                    break;
                } else {
                    n = n.parentNode;
                }
            }
        }

        if (!tooltip) {
            clearInterval(poll);
        }
    }, 400);

    nodes.forEach((node) => {
        node.addEventListener('mouseenter', onMouseEnter);
        node.addEventListener('mouseleave', onMouseOut);
    });

    return tooltip;
}
