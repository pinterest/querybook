import React from 'react';
import { TooltipDirection } from 'const/tooltip';
import { useCreateDataDoc } from 'hooks/dataDoc/useCreateDataDoc';
import { IconButton } from 'ui/Button/IconButton';

export interface ICreateDataDocButtonProps {
    // from own Props
    tooltipPos?: TooltipDirection;
    tooltip?: string;
}

export const CreateDataDocButton: React.FunctionComponent<ICreateDataDocButtonProps> = ({
    tooltipPos = 'left',
    tooltip = 'New DataDoc',
}) => {
    const handleCreateDataDoc = useCreateDataDoc();

    return (
        <IconButton
            icon="plus"
            tooltip={tooltip}
            tooltipPos={tooltipPos}
            onClick={handleCreateDataDoc}
        />
    );
};
