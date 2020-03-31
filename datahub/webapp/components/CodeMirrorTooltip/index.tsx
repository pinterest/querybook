import React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { reduxStore } from 'redux/store';
import {
    CodeMirrorTooltip,
    ICodeMirrorTooltipProps,
} from './CodeMirrorTooltip';
import { sleep } from 'lib/utils';

function mountTooltip(
    node: Element,
    props: Omit<ICodeMirrorTooltipProps, 'hide'>,
    hide: () => void
) {
    const tooltipContainer = document.createElement('div');
    tooltipContainer.id = 'Codemirror-tooltip-root';
    document.body.appendChild(tooltipContainer);

    const rect = node.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    if (windowHeight / 2 > rect.top) {
        // node is at top half of the screen
        // Show tooltip on bottom
        tooltipContainer.style.top = `${rect.bottom}px`;
    } else {
        // node is at bottom half of the screen
        // Show tooltip on top
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
    node: Element,
    props: Omit<ICodeMirrorTooltipProps, 'hide'>,
    onNodeHide?: () => void
) {
    // This sleep is needed to put this code in eventpool which allosw
    // the node itself to actually appear in the browser
    await sleep(1);

    if (!isHovered(node)) {
        if (onNodeHide) {
            onNodeHide();
        }
        return;
    }

    let tooltip = null;

    function hideTooltip() {
        if (tooltip) {
            tooltip.removeEventListener('mouseenter', onMouseEnter);
            tooltip.removeEventListener('mouseleave', onMouseOut);

            unmountTooltip(tooltip);
            tooltip = null;
        }
    }
    let hideTooltipTimeout: number;

    function hideTooltipAndNode() {
        node.removeEventListener('mouseenter', onMouseEnter);
        node.removeEventListener('mouseleave', onMouseOut);

        hideTooltip();
        if (onNodeHide) {
            onNodeHide();
        }
    }

    function onMouseOut(e) {
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
        }
        hideTooltipTimeout = setTimeout(hideTooltipAndNode, 300);
    }

    function onMouseEnter(e) {
        if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
            hideTooltipTimeout = null;
        }
    }

    tooltip = mountTooltip(node, props, hideTooltipAndNode);

    tooltip.addEventListener('mouseenter', onMouseEnter);
    tooltip.addEventListener('mouseleave', onMouseOut);

    const poll = setInterval(() => {
        if (tooltip) {
            // if node no longer exists in body, remove both
            let n: Node & ParentNode = node;
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

    node.addEventListener('mouseenter', onMouseEnter);
    node.addEventListener('mouseleave', onMouseOut);

    return tooltip;
}
