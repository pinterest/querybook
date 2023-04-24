import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import { components, OptionProps } from 'react-select';

import { useResource } from 'hooks/useResource';
import { ICancelablePromise } from 'lib/datasource';
import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { StyledText } from 'ui/StyledText/StyledText';
import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import './EntitySelect.scss';

interface IEntityWithDescription {
    label: string;
    desc?: string;
    value: string;
}

type StringOrWithDescription =
    | string
    | {
          name: string;
          desc: string;
      };

interface IEntitySelectProps {
    selectedEntities: string[];
    loadEntities: (
        keyword: string
    ) => ICancelablePromise<{ data: StringOrWithDescription[] }>;

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

const OptionWithDesc: React.FC<OptionProps<IEntityWithDescription, true>> = (
    props
) => {
    const { label, desc } = props.data as IEntityWithDescription;

    return (
        <components.Option
            {...props}
            className={clsx(props.className, 'OptionWithDesc')}
        >
            <span>{label}</span>
            {desc && (
                <StyledText
                    untitled
                    size={'xsmall'}
                    className="two-line-ellipsis"
                >
                    {desc}
                </StyledText>
            )}
        </components.Option>
    );
};

export const EntitySelect = ({
    selectedEntities,
    loadEntities,
    onSelect,
    onEntitiesChange,
    showSelected = true,
    creatable = false,
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

    const { data: entities } = useResource<StringOrWithDescription[]>(
        React.useCallback(
            () => loadEntities(searchText),
            [loadEntities, searchText]
        )
    );

    const options: IEntityWithDescription[] = React.useMemo(
        () =>
            (entities || [])
                .map((entity) => {
                    if (typeof entity === 'string') {
                        return {
                            label: entity,
                            value: entity,
                        };
                    } else {
                        return {
                            label: entity.name,
                            desc: entity.desc,
                            value: entity.name,
                        };
                    }
                })
                .filter((option) => !selectedEntities.includes(option.value)),
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
                        components: {
                            // @ts-ignore: react-select's error does not prevent the component from working
                            Option: OptionWithDesc,
                        },
                    }}
                    clearAfterSelect
                />
            </div>
        </div>
    );
};
