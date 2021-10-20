import React, { useState } from 'react';
import { TextToggleButton } from 'ui/Button/TextToggleButton';

export const SchemaSortIcon: React.FC<{
    onSortChanged: (value: boolean) => void;
}> = ({ onSortChanged }) => {
    const [isSortByName, setIsSortByName] = useState<boolean>(true);
    return (
        <div className="mr16">
            <TextToggleButton
                onChange={(value: boolean) => {
                    onSortChanged(value);
                    setIsSortByName(value);
                }}
                text={'↓Aa'}
                value={isSortByName}
                tooltip={
                    isSortByName
                        ? 'Schemas Ordered By Name'
                        : 'Schemas Ordered By Table Count'
                }
                tooltipPos="left"
            />
        </div>
    );
};
