import React from 'react';
import { chunk } from 'lodash';
import { Columns, Column } from 'ui/Column/Column';

interface IItemGridProps<T = any> {
    items: T[];
    itemRenderer: (data: T) => React.ReactChild;
    itemsPerRow?: number;
}

export const ItemGrid: React.FunctionComponent<IItemGridProps> = ({
    items,
    itemRenderer,
    itemsPerRow = 3,
}) => {
    const sizePerRow = Math.floor(12 / itemsPerRow);

    const itemRowsDOM = chunk(
        (items || []).map((item, index) => (
            <Column className={`is-${sizePerRow}`} key={index}>
                {itemRenderer(item)}
            </Column>
        )),
        itemsPerRow
    ).map((itemDOM, index) => <Columns key={index}>{itemDOM}</Columns>);

    return <div>{itemRowsDOM}</div>;
};
