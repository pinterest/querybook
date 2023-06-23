import React from 'react';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';

export enum TextToSQLMode {
    GENERATE = 'GENERATE',
    EDIT = 'EDIT',
}

interface IProps {
    selectedMode: TextToSQLMode;
    modes: TextToSQLMode[];
    onModeSelect: (mode: TextToSQLMode) => any;
}

export const TextToSQLModeSelector: React.FC<IProps> = ({
    selectedMode,
    modes,
    onModeSelect,
}) => {
    const engineItems = modes.map((mode) => ({
        name: <span>{mode}</span>,
        onClick: onModeSelect.bind(null, mode),
        checked: selectedMode === mode,
    }));

    return (
        <Dropdown
            customButtonRenderer={() => <div>{selectedMode}</div>}
            layout={['bottom', 'left']}
            className="engine-selector-dropdown"
        >
            {engineItems.length > 1 && (
                <div className="engine-selector-wrapper">
                    <ListMenu items={engineItems} type="select" />
                </div>
            )}
        </Dropdown>
    );
};
