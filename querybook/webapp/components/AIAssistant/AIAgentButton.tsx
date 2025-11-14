import React from 'react';

interface AIAgentButtonProps {
    cellId: number;
    renderer: (cellId: number) => React.ReactNode;
}

const AIAgentButton = ({ cellId, renderer }: AIAgentButtonProps) => {
    if (!renderer) {
        return null;
    }

    return renderer(cellId);
};

export default AIAgentButton;
