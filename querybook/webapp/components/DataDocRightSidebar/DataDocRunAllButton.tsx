import React from 'react';

import { IconButton } from 'ui/Button/IconButton';

import { useRunAllFromIndex } from '../../hooks/dataDoc/useRunAllFromIndex';

interface IProps {
    docId: number;
}

export const DataDocRunAllButton: React.FunctionComponent<IProps> = ({
    docId,
}) => {
    const onRunAll = useRunAllFromIndex(docId, null);

    return (
        <IconButton
            icon="PlayCircle"
            onClick={onRunAll}
            tooltip="Run all cells in the doc"
            tooltipPos="left"
            title="Run All"
        />
    );
};
