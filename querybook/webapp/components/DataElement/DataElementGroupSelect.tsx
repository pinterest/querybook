import React, { useMemo } from 'react';

import { HoverIconTag } from 'ui/Tag/HoverIconTag';

import { DataElementSelect } from './DataElementSelect';

import './DataElement.scss';

export const DataElementGroupSelect: React.FC<{
    dataElements?: string[];
    updateDataElements: (newDataElements: string[]) => void;
}> = ({ dataElements: propsDataElement, updateDataElements }) => {
    const dataElements = useMemo(
        () => propsDataElement ?? [],
        [propsDataElement]
    );

    const handleDataElementSelect = React.useCallback(
        (dataElement: string) => {
            updateDataElements([...dataElements, dataElement]);
        },
        [dataElements, updateDataElements]
    );

    const handleTagRemove = React.useCallback(
        (dataElement: string) => {
            updateDataElements(
                dataElements.filter(
                    (existingDataElement) => existingDataElement !== dataElement
                )
            );
        },
        [dataElements, updateDataElements]
    );

    const dataElementsListDOM = dataElements.length ? (
        <div className="data-element-list">
            {dataElements.map((tag) => (
                <HoverIconTag
                    key={tag}
                    name={tag}
                    iconOnHover={'X'}
                    onIconHoverClick={() => handleTagRemove(tag)}
                    mini
                    highlighted
                />
            ))}
        </div>
    ) : null;

    return (
        <div className="DataElementGroupSelect">
            {dataElementsListDOM}
            <DataElementSelect
                existingDataElements={dataElements}
                onSelect={handleDataElementSelect}
            />
        </div>
    );
};
