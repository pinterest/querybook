import React from 'react';
import classNames from 'classnames';

interface IItemTableProps<T = any> {
    items: T[];
    itemRenderer: (data: T) => React.ReactChild;

    className?: string;
}

export const ItemTable: React.FunctionComponent<IItemTableProps> = ({
    items,
    itemRenderer,
    className = '',
}) => {
    const itemRowsDOM = items.map((item, index) => (
        <tr key={index}>{itemRenderer(item)}</tr>
    ));

    const tableClassName = classNames({
        table: true,
        [className]: Boolean(className),
    });

    return (
        <table className={tableClassName}>
            <tbody>{itemRowsDOM}</tbody>
        </table>
    );
};
