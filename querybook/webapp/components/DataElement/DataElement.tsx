import React from 'react';

import {
    DataElementAssociationType,
    IDataElement,
    IDataElementAssociation,
} from 'const/dataElement';
import { Icon } from 'ui/Icon/Icon';
import { Popover } from 'ui/Popover/Popover';
import { PopoverHoverWrapper } from 'ui/Popover/PopoverHoverWrapper';
import { Tag } from 'ui/Tag/Tag';

import { DataElementCard } from './DataElementCard';

const DataElementTag = ({
    dataElement,
}: {
    dataElement: IDataElement | string;
}) => {
    const isDataElement = typeof dataElement === 'object';

    return (
        <PopoverHoverWrapper>
            {(showPopover, anchorElement) => (
                <>
                    <Tag mini>
                        {isDataElement && (
                            <Icon
                                name="LayoutGrid"
                                color="accent"
                                size={16}
                                className="mr4"
                            />
                        )}
                        <span>
                            {!isDataElement ? dataElement : dataElement.name}
                        </span>
                    </Tag>
                    {showPopover && isDataElement && (
                        <Popover
                            onHide={() => null}
                            anchor={anchorElement}
                            layout={['right', 'top']}
                        >
                            <DataElementCard dataElement={dataElement} />
                        </Popover>
                    )}
                </>
            )}
        </PopoverHoverWrapper>
    );
};

const ListDataElement = ({
    dataElement,
}: {
    dataElement: IDataElement | string;
}) => (
    <>
        <Icon name="List" color="accent" size={16} className="mr4" />
        {'list< '}
        <DataElementTag dataElement={dataElement} />
        {' >'}
    </>
);

const MapDataElement = ({
    keyDataElement,
    valueDataElement,
}: {
    keyDataElement: IDataElement | string;
    valueDataElement: IDataElement | string;
}) => (
    <>
        <Icon name="Network" color="accent" size={16} className="mr4" />
        {'map< '}
        <DataElementTag dataElement={keyDataElement} />
        <div className="ml4 mr4">{':'}</div>
        <DataElementTag dataElement={valueDataElement} />
        {' >'}
    </>
);

export const DataElement: React.FunctionComponent<{
    association: IDataElementAssociation;
}> = ({ association }) => {
    const { type, key, value } = association;

    return (
        <div className="flex-row">
            {type === DataElementAssociationType.ARRAY ? (
                <ListDataElement dataElement={value} />
            ) : type === DataElementAssociationType.MAP ? (
                <MapDataElement keyDataElement={key} valueDataElement={value} />
            ) : (
                <DataElementTag dataElement={value} />
            )}
        </div>
    );
};
