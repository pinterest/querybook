import React, { useCallback, useState } from 'react';

import { useResource } from 'hooks/useResource';
import { ICancelablePromise } from 'lib/datasource';
import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import './EntitySelect.scss';

interface IEntitySelectProps {
    selectedEntities: string[];
    loadEntities: (keyword: string) => ICancelablePromise<{ data: string[] }>;

    showSelected?: boolean;
    creatable?: boolean;
    placeholder?: string;
    onSelect?: (entity: string) => void;
    onEntitiesChange?: (entities: string[]) => void;

    /**
     * will validate only if creatable is true
     */
    validateEntity?: (entity: string) => boolean;

    mini?: boolean;
}

export const EntitySelect = ({
    selectedEntities,
    loadEntities,
    onSelect,
    onEntitiesChange,
    showSelected = true,
    creatable = true,
    placeholder = 'search',
    validateEntity = null,
    mini = false,
}: IEntitySelectProps) => {
    const [searchText, setSearchText] = useState('');
    const reactSelectStyle = React.useMemo(
        () =>
            makeReactSelectStyle(
                true,
                mini ? miniReactSelectStyles : undefined
            ),
        [mini]
    );

    const { data: entities } = useResource<string[]>(
        React.useCallback(
            () => loadEntities(searchText),
            [loadEntities, searchText]
        )
    );

    const options = React.useMemo(
        () =>
            (entities || []).filter(
                (entity) => !selectedEntities.includes(entity)
            ),
        [entities, selectedEntities]
    );

    const isInvalidForCreation = React.useMemo(
        () =>
            creatable &&
            searchText.length > 0 &&
            (selectedEntities.includes(searchText) ||
                (validateEntity && !validateEntity(searchText))),
        [searchText, creatable, selectedEntities, validateEntity]
    );

    const handleEntitySelect = useCallback(
        (option) => {
            if (!selectedEntities.includes(option)) {
                onSelect?.(option);
                onEntitiesChange?.([...selectedEntities, option]);
            }
        },
        [selectedEntities, onSelect, onEntitiesChange]
    );

    const handleEntityRemove = useCallback(
        (entity: string) => {
            onEntitiesChange(selectedEntities.filter((e) => e !== entity));
        },
        [selectedEntities, onEntitiesChange]
    );

    return (
        <div className="EntitySelect">
            {showSelected && selectedEntities.length > 0 && (
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
            <div className={isInvalidForCreation ? 'invalid' : undefined}>
                <SimpleReactSelect
                    creatable={creatable}
                    value={searchText}
                    options={options}
                    onChange={(val) => handleEntitySelect(val)}
                    selectProps={{
                        onInputChange: (newValue) => setSearchText(newValue),
                        placeholder,
                        styles: reactSelectStyle,
                        noOptionsMessage: () => null,
                    }}
                    clearAfterSelect
                />
            </div>
        </div>
    );
};
