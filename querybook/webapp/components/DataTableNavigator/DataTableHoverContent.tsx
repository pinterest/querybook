import React, { useMemo } from 'react';
import { ContentState } from 'draft-js';

import { Title } from 'ui/Title/Title';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';

import './DataTableHoverContent.scss';
import { useDataTable } from 'hooks/redux/useDataTable';
import { Loader } from 'ui/Loader/Loader';
import { DataTableTags } from 'components/DataTableTags/DataTableTags';

export const DataTableHoverContent: React.FC<{
    tableId: number;
    tableName: string;
}> = ({ tableId, tableName }) => {
    const { table, tableColumns, getTable } = useDataTable(tableId);
    const tableDescription = useMemo(
        () =>
            table?.description
                ? (table.description as ContentState).getPlainText()
                : '',
        [table?.description]
    );
    const columnNames = useMemo(
        () => tableColumns?.map((c) => c.name).join(', '),
        [tableColumns]
    );

    const renderTableView = () => {
        const tagsDOM = <DataTableTags tableId={tableId} readonly />;
        const descriptionDOM = Boolean(tableDescription) && (
            <div className="mb4">
                <Title size="small">Description</Title>
                <ShowMoreText text={tableDescription} />
            </div>
        );

        const columnsDOM = Boolean(columnNames) && (
            <div className="mb4">
                <Title size="small">Columns</Title>
                <div>
                    <ShowMoreText text={columnNames} />
                </div>
            </div>
        );

        return (
            <>
                {tagsDOM}
                {descriptionDOM}
                {columnsDOM}
            </>
        );
    };

    return (
        <div className="DataTableHoverContent">
            <Title
                className="DataTableHoverContent-table-name mb4"
                size="smedium"
            >
                {tableName}
            </Title>
            <Loader
                item={table}
                itemKey={tableId}
                itemLoader={getTable}
                renderer={renderTableView}
            />
        </div>
    );
};
