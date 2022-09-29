import React from 'react';
import {
    Controls,
    ReactFlowState,
    useReactFlow,
    useStore,
    useStoreApi,
} from 'react-flow-renderer';

import { IconButton } from 'ui/Button/IconButton';

import { getLayoutedElements, LayoutDirection } from './helpers';

import './GraphControls.scss';

const isInteractiveSelector = (s: ReactFlowState) =>
    s.nodesDraggable && s.nodesConnectable && s.elementsSelectable;

export const GraphControls = () => {
    const store = useStoreApi();
    const isInteractive = useStore(isInteractiveSelector);
    const { zoomIn, zoomOut, fitView } = useReactFlow();

    const reactFlowInstance = useReactFlow();

    const onLayout = React.useCallback((direction: LayoutDirection = 'LR') => {
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

    const onFitView = () => fitView({ maxZoom: 1.2 });

    const onToggleInteractivity = () => {
        store.setState({
            nodesDraggable: !isInteractive,
            nodesConnectable: !isInteractive,
            elementsSelectable: !isInteractive,
        });
    };

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
                tooltipPos={'left'}
            />
            <IconButton
                icon="AlignCenterHorizontal"
                size={18}
                onClick={() => onLayout('LR')}
                tooltip={'Layout Horizontal'}
                tooltipPos={'left'}
            />
            <IconButton
                icon="Plus"
                size={18}
                onClick={onZoomIn}
                tooltip={'Zoom In'}
                tooltipPos={'left'}
            />
            <IconButton
                icon="Minus"
                size={18}
                onClick={onZoomOut}
                tooltip={'Zoom Out'}
                tooltipPos={'left'}
            />
            <IconButton
                icon="Maximize"
                onClick={onFitView}
                tooltip={'Fit View'}
                tooltipPos={'left'}
            />
            <IconButton
                icon={isInteractive ? 'Unlock' : 'Lock'}
                onClick={onToggleInteractivity}
                tooltip={'Fit View'}
                tooltipPos={'left'}
            />
        </Controls>
    );
};
