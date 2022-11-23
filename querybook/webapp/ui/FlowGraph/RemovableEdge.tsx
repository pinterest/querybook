import React from 'react';
import { getBezierPath, Position } from 'reactflow';

import { IconButton } from 'ui/Button/IconButton';

const foreignObjectSize = 24;

interface IProps {
    id: string;
    data: {
        onRemove: (id: string) => void;
    };
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourcePosition: Position;
    targetPosition: Position;
    style: Record<string, any>;
    markerEnd: string;
}

export const RemovableEdge: React.FC<IProps> = ({
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
}: IProps) => {
    const { onRemove } = data;
    const [edgePath, labelX, labelY] = getBezierPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
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
                x={labelX - foreignObjectSize / 2}
                y={labelY - foreignObjectSize / 2}
            >
                <IconButton
                    icon="X"
                    invertCircle
                    onClick={() => onRemove(id)}
                    size={16}
                />
            </foreignObject>
        </>
    );
};
