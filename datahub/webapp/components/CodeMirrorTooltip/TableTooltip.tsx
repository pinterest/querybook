import React from 'react';
import { ContentState } from 'draft-js';
import { IDataColumn, IDataTable, IDataSchema } from 'const/metastore';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { IconButton } from 'ui/Button/IconButton';
import { setSidebarTableId } from 'lib/dataHubUI';

interface IProps {
    table: IDataTable;
    columns: IDataColumn[];
    schema: IDataSchema;
    openTableModal?: () => any;
}

export const TableTooltip: React.FunctionComponent<IProps> = ({
    table,
    columns,
    schema,
    openTableModal,
}) => {
    const tableName =
        table && schema ? `${schema.name}.${table.name}` : table.name;
    const description = table.description
        ? (table.description as ContentState).getPlainText()
        : '';
    const columnNames = (columns || [])
        .map((column) => `- ${column.name}: ${column.type}`)
        .join('\n');
    const location = table.location;

    const lastPartitions = table.latest_partitions ?? '[]';

    const seeDetailsButton = openTableModal && (
        <IconButton
            size={20}
            onClick={openTableModal}
            noPadding
            icon={'external-link'}
            tooltip={'Details'}
            tooltipPos={'down'}
        />
    );
    const pinToSidebarButton = (
        <IconButton
            noPadding
            size={20}
            onClick={() => setSidebarTableId(table.id)}
            icon={'sidebar'}
            tooltip={'Pin'}
            tooltipPos={'down'}
        />
    );

    const descriptionDOM = description && (
        <>
            <h6>Description</h6>
            <p>
                <ShowMoreText text={description} />
            </p>
        </>
    );
    const partitionDOM = lastPartitions && lastPartitions !== '[]' && (
        <>
            <h6>Latest Partitions</h6>
            <p>
                <ShowMoreText text={lastPartitions} />
            </p>
        </>
    );
    const columnsDOM = (
        <>
            <h6>Column Names</h6>
            <p>
                <ShowMoreText text={columnNames} seeLess={true} />
            </p>
        </>
    );
    const locationDOM = location && (
        <>
            <h6>Location</h6>
            <p>{location}</p>
        </>
    );

    const contentDOM = (
        <div className="rich-text-content ">
            <div className="table-tooltip-header flex-row">
                <b className="table-tooltip-header-title">{tableName}</b>
                <span>
                    {pinToSidebarButton}
                    {seeDetailsButton}
                </span>
            </div>

            {descriptionDOM}
            {partitionDOM}
            {columnsDOM}
            {locationDOM}
        </div>
    );

    return <div>{contentDOM}</div>;
};
