import React from 'react';
import { getBezierPath, getEdgeCenter } from 'react-flow-renderer';
import { IconButton } from 'ui/Button/IconButton';

const foreignObjectSize = 32;

export const RemovableEdge = ({
    id,
    data,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
}) => {
    const { onRemove } = data;
    const edgePath = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
    });
    const [edgeCenterX, edgeCenterY] = getEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });

    return (
        <>
            <path
                id={id}
                style={style}
                className="react-flow__edge-path"
                d={edgePath}
                markerEnd={markerEnd}
            />
            <foreignObject
                width={foreignObjectSize}
                height={foreignObjectSize}
                x={edgeCenterX - foreignObjectSize / 2}
                y={edgeCenterY - foreignObjectSize / 2}
                className="flex-center"
            >
                <IconButton
                    icon="X"
                    invertCircle
                    onClick={() => onRemove(id)}
                />
            </foreignObject>
        </>
    );
};
