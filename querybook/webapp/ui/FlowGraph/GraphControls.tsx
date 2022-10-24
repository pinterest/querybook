import React, { useCallback } from 'react';
import {
    Controls,
    ReactFlowState,
    useReactFlow,
    useStore,
    useStoreApi,
} from 'react-flow-renderer';

import { IconButton } from 'ui/Button/IconButton';

import {
    getLayoutedElements,
    LayoutDirection,
    MAX_ZOOM_LEVEL,
} from './helpers';

const isInteractiveSelector = (s: ReactFlowState) =>
    s.nodesDraggable && s.nodesConnectable && s.elementsSelectable;

export const GraphControls = () => {
    const store = useStoreApi();
    const isInteractive = useStore(isInteractiveSelector);
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const reactFlowInstance = useReactFlow();

    const onLayout = useCallback((direction: LayoutDirection = 'LR') => {
        const layoutedDAG = getLayoutedElements(
            reactFlowInstance.getNodes(),
            reactFlowInstance.getEdges(),
            direction
        );
        reactFlowInstance.setNodes([...layoutedDAG.nodes]);
        reactFlowInstance.setEdges([...layoutedDAG.edges]);
    }, []);

    const onZoomIn = () => zoomIn();

    const onZoomOut = () => zoomOut();

    const onFitView = () => fitView({ maxZoom: MAX_ZOOM_LEVEL });

    const onToggleInteractivity = useCallback(() => {
        store.setState({
            nodesDraggable: !isInteractive,
            nodesConnectable: !isInteractive,
            elementsSelectable: !isInteractive,
        });
    }, [store, isInteractive]);

    return (
        <Controls
            showZoom={false}
            showFitView={false}
            showInteractive={false}
            className="flex-column"
        >
            <IconButton
                icon="AlignCenterVertical"
                size={18}
                onClick={() => onLayout('TB')}
                tooltip={'Layout Vertical'}
                tooltipPos={'right'}
            />
            <IconButton
                icon="AlignCenterHorizontal"
                size={18}
                onClick={() => onLayout('LR')}
                tooltip={'Layout Horizontal'}
                tooltipPos={'right'}
            />
            <IconButton
                icon="Plus"
                size={18}
                onClick={onZoomIn}
                tooltip={'Zoom In'}
                tooltipPos={'right'}
            />
            <IconButton
                icon="Minus"
                size={18}
                onClick={onZoomOut}
                tooltip={'Zoom Out'}
                tooltipPos={'right'}
            />
            <IconButton
                icon="Maximize"
                size={18}
                onClick={onFitView}
                tooltip={'Fit View'}
                tooltipPos={'right'}
            />
            <IconButton
                icon={isInteractive ? 'Unlock' : 'Lock'}
                size={18}
                onClick={onToggleInteractivity}
                tooltip={'Toggle Interactivity'}
                tooltipPos={'right'}
            />
        </Controls>
    );
};
