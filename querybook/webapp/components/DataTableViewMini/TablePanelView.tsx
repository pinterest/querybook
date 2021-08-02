import React from 'react';
import { ContentState } from 'draft-js';
import styled from 'styled-components';

import { getHumanReadableByteSize } from 'lib/utils/number';
import { generateFormattedDate } from 'lib/utils/datetime';

import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { PanelSection, SubPanelSection } from './PanelSection';

import { Loader } from 'ui/Loader/Loader';
import { useDataTable } from 'hooks/redux/useDataTable';

interface ITablePanelViewProps {
    tableId: number;
    columnId?: number;
    onColumnRowClick?: (id: number) => any;
}

function hasPartitions(partitions: string) {
    return partitions && partitions !== '[]';
}

export const TablePanelView: React.FunctionComponent<ITablePanelViewProps> = ({
    tableId,
    onColumnRowClick,
    columnId,
}) => {
    const { table, schema, tableColumns, getTable } = useDataTable(tableId);

    const renderPanelView = () => {
        const overviewSection = (
            <PanelSection title="table">
                <SubPanelSection title="schema">{schema.name}</SubPanelSection>
                <SubPanelSection title="name">{table.name}</SubPanelSection>
                <SubPanelSection title="description" hideIfNoContent>
                    {table.description
                        ? (table.description as ContentState).getPlainText()
                        : ''}
                </SubPanelSection>
                <DataTableTags tableId={table.id} readonly />
            </PanelSection>
        );

        const columnsSection = (
            <PanelSection title="columns">
                {tableColumns.map((col) => (
                    <ColumnRow
                        key={col.id}
                        onClick={onColumnRowClick.bind(null, col.id)}
                        name={col.name}
                        type={col.type}
                        selected={col.id === columnId}
                    />
                ))}
            </PanelSection>
        );

        const partitionsSection =
            hasPartitions(table.latest_partitions) ||
            hasPartitions(table.earliest_partitions) ? (
                <PanelSection title="partitions">
                    <SubPanelSection title={`Latest`}>
                        {table.latest_partitions}
                    </SubPanelSection>

                    <SubPanelSection title={`Earliest`}>
                        {table.earliest_partitions}
                    </SubPanelSection>
                </PanelSection>
            ) : null;

        const detailsSection = (
            <PanelSection title="details">
                <SubPanelSection title="data size (bytes)" hideIfNoContent>
                    {getHumanReadableByteSize(table.data_size_bytes)}
                </SubPanelSection>
                <SubPanelSection title="Location" hideIfNoContent>
                    {table.location}
                </SubPanelSection>
                <SubPanelSection title="Last Synced" hideIfNoContent>
                    {generateFormattedDate(table.updated_at)}
                </SubPanelSection>
            </PanelSection>
        );

        return (
            <div>
                {overviewSection}
                {columnsSection}
                {partitionsSection}
                {detailsSection}
            </div>
        );
    };

    return (
        <Loader
            item={table}
            itemKey={tableId}
            itemLoader={getTable}
            renderer={renderPanelView}
        />
    );
};

interface IStyledColumnRowProps {
    selected?: boolean;
}
const StyledColumnRow = styled.div<IStyledColumnRowProps>`
    cursor: pointer;
    margin-left: -32px;
    padding: 2px 0px 2px 28px;
    word-break: break-all;

    .column-row-name {
        color: var(--dark-text-color);
    }

    .column-row-type {
        color: var(--light-text-color);
    }

    ${({ selected }) =>
        selected
            ? `
    background-color: var(--color-accent-light);
    `
            : `
    :hover {
        .column-row-name,
        .column-row-type {
            color: var(--color-accent);
        }
    }
            `};
`;
const ColumnRow: React.FunctionComponent<{
    name: string;
    type: string;
    onClick: () => any;
    selected?: boolean;
}> = ({ name, type, onClick, selected }) => (
    <StyledColumnRow onClick={onClick} selected={selected}>
        <span className="column-row-name">{name}:</span>
        <span className="column-row-type">{type}</span>
    </StyledColumnRow>
);
