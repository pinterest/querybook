import React from 'react';

import { Dropdown } from 'ui/Dropdown/Dropdown';
import { ListMenu } from 'ui/Menu/ListMenu';

export enum AIMode {
    GENERATE = 'GENERATE',
    EDIT = 'EDIT',
}

interface IAIModeSelectorProps {
    aiMode: AIMode;
    aiModes: AIMode[];
    onModeSelect: (mode: AIMode) => any;
}

export const AIModeSelector: React.FC<IAIModeSelectorProps> = ({
    aiMode,
    aiModes,
    onModeSelect,
}) => {
    const engineItems = aiModes.map((mode) => ({
        name: <span>{mode}</span>,
        onClick: onModeSelect.bind(null, mode),
        checked: aiMode === mode,
    }));

    return (
        <Dropdown
            customButtonRenderer={() => <div>{aiMode}</div>}
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
