import React, { useCallback, useState } from 'react';
import AsyncSelect, { Props as AsyncProps } from 'react-select/async-creatable';

import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import './EntitySelect.scss';

interface IEntitySelectProps {
    selectedEntities: string[];
    loadEntityOptions: (searchText: string) => Promise<string[]>;

    creatable?: boolean;
    placeholder?: string;
    onSelect?: (entity: string) => void;
    onEntitiesChange?: (entities: string[]) => void;
    isEntityValid?: (entity: string) => boolean;
    mini?: boolean;
    usePortalMenu?: boolean;
}

export const EntitySelect: React.FunctionComponent<IEntitySelectProps> = ({
    selectedEntities,
    loadEntityOptions,
    onSelect,
    onEntitiesChange,
    placeholder = 'search',
    isEntityValid = null,
    mini = false,
    usePortalMenu = true,
}) => {
    const [searchText, setSearchText] = useState('');
    const selectProps: Partial<AsyncProps<any, boolean>> = {};
    const reactSelectStyle = React.useMemo(
        () =>
            makeReactSelectStyle(
                usePortalMenu,
                mini ? miniReactSelectStyles : undefined
            ),
        [mini, usePortalMenu]
    );
    if (usePortalMenu) {
        selectProps.menuPortalTarget = overlayRoot;
    }

    const loadOptions = useCallback(
        async (searchText: string) => {
            const options = await loadEntityOptions(searchText);
            return options.map((option) => ({
                value: option,
                label: option,
            }));
        },
        [loadEntityOptions]
    );

    const handleEntitySelect = useCallback(
        (option: { value: string; label: string }) => {
            const valid =
                !selectedEntities.includes(option.value) &&
                (isEntityValid?.(option.value) ?? true);
            if (valid) {
                onSelect?.(option.value);
                onEntitiesChange?.([...selectedEntities, option.value]);
            }
        },
        [selectedEntities, isEntityValid, onSelect, onEntitiesChange]
    );

    const handleEntityRemove = useCallback(
        (entity: string) => {
            onEntitiesChange(selectedEntities.filter((e) => e !== entity));
        },
        [selectedEntities, onEntitiesChange]
    );

    return (
        <div className="EntitySelect">
            {selectedEntities.length > 0 && (
                <div className="entity-list">
                    {selectedEntities.map((entity) => (
                        <HoverIconTag
                            key={entity}
                            name={entity}
                            iconOnHover={'X'}
                            onIconHoverClick={() => handleEntityRemove(entity)}
                            highlighted
                            mini
                        />
                    ))}
                </div>
            )}
            <AsyncSelect
                styles={reactSelectStyle}
                placeholder={placeholder}
                onChange={handleEntitySelect}
                defaultOptions
                loadOptions={loadOptions}
                inputValue={searchText}
                value={null}
                onInputChange={(text) => setSearchText(text)}
                clearAfterSelect
                {...selectProps}
            />
        </div>
    );
};
