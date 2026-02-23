import React from 'react';

interface AIAgentButtonProps {
    cellId?: number;
    isAdhoc?: boolean;
    renderer: (cellId?: number, isAdhoc?: boolean) => React.ReactNode;
}

const AIAgentButton: React.FC<AIAgentButtonProps> = ({
    cellId,
    isAdhoc,
    renderer,
}) => {
    if (!renderer) {
        return null;
    }

    return <>{renderer(cellId, isAdhoc)}</>;
};

export default AIAgentButton;
