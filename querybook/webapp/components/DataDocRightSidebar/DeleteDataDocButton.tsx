import React from 'react';

import { TooltipDirection } from 'const/tooltip';
import { useDeleteDataDoc } from 'hooks/dataDoc/useDeleteDataDoc';
import { IconButton } from 'ui/Button/IconButton';

export interface IDeleteDataDocButtonProps {
    // from own Props
    docId: number;
    tooltipPos?: TooltipDirection;
    tooltip?: string;
}

export const DeleteDataDocButton: React.FunctionComponent<
    IDeleteDataDocButtonProps
> = ({ docId, tooltip = 'Delete', tooltipPos = 'left' }) => {
    const handleDeleteDataDoc = useDeleteDataDoc();

    return (
        <IconButton
            icon="Trash"
            tooltip={tooltip}
            tooltipPos={tooltipPos}
            onClick={() => handleDeleteDataDoc(docId)}
            title="Delete"
        />
    );
};
