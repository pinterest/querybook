import { ContentState } from 'draft-js';
import React, { useMemo } from 'react';

import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { useDataTable } from 'hooks/redux/useDataTable';
import { Loader } from 'ui/Loader/Loader';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { StyledText } from 'ui/StyledText/StyledText';
import { Title } from 'ui/Title/Title';

import './DataTableHoverContent.scss';

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
        const tagsDOM = <DataTableTags tableId={tableId} readonly mini />;
        const descriptionDOM = Boolean(tableDescription) && (
            <div className="mb4">
                <Title size="small">Description</Title>
                <StyledText size="xsmall">
                    <ShowMoreText text={tableDescription} />
                </StyledText>
            </div>
        );

        const columnsDOM = Boolean(columnNames) && (
            <div className="mb4">
                <Title size="small">Columns</Title>
                <StyledText size="xsmall">
                    <ShowMoreText text={columnNames} />
                </StyledText>
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
            <Title className="mb4 DataTableHoverContent-name" size="smedium">
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
