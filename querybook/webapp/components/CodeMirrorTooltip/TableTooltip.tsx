import { ContentState } from 'draft-js';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { IDataColumn, IDataSchema, IDataTable } from 'const/metastore';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { setSidebarTableId } from 'lib/querybookUI';
import { navigateWithinEnv } from 'lib/utils/query-string';
import * as dataSourcesActions from 'redux/dataSources/action';
import { IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';

interface IProps {
    table: IDataTable;
    columns: IDataColumn[];
    schema: IDataSchema;
    hidePinItButton?: boolean;
    openTableModal?: () => any;
}

export const TableTooltip: React.FunctionComponent<IProps> = ({
    table,
    columns,
    schema,
    hidePinItButton = false,
    openTableModal,
}) => {
    const tableName =
        table && schema ? `${schema.name}.${table.name}` : table.name;
    const description = table.description
        ? (table.description as ContentState).getPlainText()
        : '';
    const columnNames = (columns || []).map(
        (column) => `- ${column.name}: ${column.type}`
    );
    const location = table.location;

    const lastPartitions = table.latest_partitions ?? '[]';

    const seeDetailsButton = openTableModal && (
        <IconButton
            size={18}
            onClick={openTableModal}
            noPadding
            icon={'ExternalLink'}
            tooltip={'Details'}
            tooltipPos={'left'}
            className="ml4"
        />
    );
    const pinToSidebarButton = !hidePinItButton && (
        <IconButton
            noPadding
            size={18}
            onClick={() => setSidebarTableId(table.id)}
            icon={'Sidebar'}
            tooltip={'Pin'}
            tooltipPos={'left'}
        />
    );

    const descriptionDOM = description && (
        <>
            <div className="tooltip-title">Description</div>
            <div className="tooltip-content">
                <ShowMoreText text={description} />
            </div>
        </>
    );
    const tagsDOM = <DataTableTags tableId={table.id} readonly mini />;
    const partitionDOM = lastPartitions && lastPartitions !== '[]' && (
        <>
            <div className="tooltip-title">Latest Partitions</div>
            <div className="tooltip-content">
                <ShowMoreText text={lastPartitions} />
            </div>
        </>
    );
    const columnsDOM = (
        <>
            <div className="tooltip-title">Column Names</div>
            <div className="tooltip-content">
                <ShowMoreText text={columnNames} seeLess={true} />
            </div>
        </>
    );
    const locationDOM = location && (
        <>
            <div className="tooltip-title">Location</div>
            <div className="tooltip-content">{location}</div>
        </>
    );

    const contentDOM = (
        <>
            <div className="table-tooltip-header flex-row">
                <div>{tableName}</div>
                <div className="flex-row mt4 ml4">
                    {pinToSidebarButton}
                    {seeDetailsButton}
                </div>
            </div>
            {descriptionDOM}
            {tagsDOM}
            {partitionDOM}
            {columnsDOM}
            {locationDOM}
        </>
    );

    return <div className="rich-text-content ">{contentDOM}</div>;
};

export const TableTooltipByName: React.FunctionComponent<{
    metastoreId: number;
    tableFullName: string;
    hidePinItButton?: boolean;
    showDetails?: boolean;
}> = ({
    metastoreId,
    tableFullName,
    hidePinItButton = true,
    showDetails = true,
}) => {
    const dispatch = useDispatch();
    const [tableId, setTableId] = useState(null);

    const openTableModal = useCallback(() => {
        navigateWithinEnv(`/table/${tableId}/`, {
            isModal: true,
        });
    }, [tableId]);

    useEffect(() => {
        const fetchTable = async () => {
            try {
                const [schemaName, tableName] = tableFullName.split('.');
                const table: any = await dispatch(
                    dataSourcesActions.fetchDataTableByNameIfNeeded(
                        schemaName,
                        tableName,
                        metastoreId
                    )
                );
                setTableId(table.id);
            } catch (error) {
                console.error('Error fetching table:', error);
            }
        };

        fetchTable();
    }, [tableFullName]);

    const { table, schema, columns } = useShallowSelector(
        (state: IStoreState) => {
            const tableFromState = state.dataSources.dataTablesById[tableId];
            const schemaFromState = tableFromState
                ? state.dataSources.dataSchemasById[tableFromState.schema]
                : null;
            const columnsFromState = tableFromState
                ? (tableFromState.column || []).map(
                      (id) => state.dataSources.dataColumnsById[id]
                  )
                : [];

            return {
                table: tableFromState,
                schema: schemaFromState,
                columns: columnsFromState,
            };
        }
    );

    if (!tableId || !table) {
        return null;
    }

    return (
        <TableTooltip
            table={table}
            schema={schema}
            columns={columns}
            hidePinItButton={hidePinItButton}
            openTableModal={showDetails ? openTableModal : undefined}
        />
    );
};
