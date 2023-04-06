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

    const isValid = React.useMemo(
        () =>
            !searchText ||
            (!selectedEntities.includes(searchText) &&
                validateEntity(searchText)),
        [searchText, selectedEntities, validateEntity]
    );

    const handleEntitySelect = useCallback(
        (option) => {
            const valid =
                !selectedEntities.includes(option) &&
                (validateEntity?.(option) ?? true);
            if (valid) {
                onSelect?.(option);
                onEntitiesChange?.([...selectedEntities, option]);
            }
        },
        [selectedEntities, validateEntity, onSelect, onEntitiesChange]
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
            <div className={isValid ? undefined : 'invalid'}>
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
