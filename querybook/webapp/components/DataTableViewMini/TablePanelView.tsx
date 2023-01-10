import { ContentState } from 'draft-js';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { DataTableTags } from 'components/DataTableTags/DataTableTags';
import { useDataTable } from 'hooks/redux/useDataTable';
import { ComplexType, parseType } from 'lib/utils/complex-types';
import { generateFormattedDate } from 'lib/utils/datetime';
import { stopPropagationAndDefault } from 'lib/utils/noop';
import { getHumanReadableByteSize } from 'lib/utils/number';
import { IconButton } from 'ui/Button/IconButton';
import { AllLucideIconNames } from 'ui/Icon/LucideIcons';
import { Loader } from 'ui/Loader/Loader';

import { ColumnIcon } from './ColumnIcon';
import { PanelSection, SubPanelSection } from './PanelSection';

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
        const partitionKeyList = table.column_info?.partition_keys ?? [];

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
                        icon={
                            partitionKeyList.includes(col.name) ? 'Key' : null
                        }
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
    indent?: number;
    selected?: boolean;
}
const StyledColumnRow = styled.div<IStyledColumnRowProps>`
    cursor: pointer;
    padding: 2px 0px;

    margin-bottom: 4px;
    display: flex;
    flex-direction: row;
    align-items: center;

    .column-row-name {
        user-select: none;

        font-size: var(--small-text-size);
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-right: 8px;

        color: var(--text-dark);
    }

    .column-row-type {
        margin-left: auto;
        text-transform: uppercase;
        user-select: none;

        font-size: var(--xxsmall-text-size);
        color: var(--text-light);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 50%;
    }

    .column-row-expand-icon {
        margin-left: -16px;
        padding-right: 4px;
    }

    ${({ indent }) => indent && `margin-left: ${indent * 16}px`};

    ${({ selected }) =>
        selected
            ? `
    background-color: var(--color-accent-light);
    `
            : `
    :hover {
        .column-row-name,
        .column-row-type {
            color: var(--color-accent-dark);
        }
    }
            `};
`;
const ColumnRow: React.FunctionComponent<{
    name: string;
    type: string;
    typeChildren?: ComplexType[];
    onClick: () => any;
    selected?: boolean;
    icon?: AllLucideIconNames;
    indent?: number;
}> = ({ name, type, typeChildren, onClick, selected, icon, indent = 0 }) => {
    const [expanded, setExpanded] = React.useState(false);
    const effectiveTypeChildren = useMemo(
        () =>
            typeChildren ? typeChildren : parseType('', type).children ?? [],
        [type, typeChildren]
    );
    const hasChildren = effectiveTypeChildren.length > 0;

    return (
        <>
            <StyledColumnRow
                onClick={onClick}
                indent={indent}
                selected={selected}
            >
                {hasChildren && (
                    <IconButton
                        icon={expanded ? 'Minus' : 'Plus'}
                        noPadding={true}
                        size="12"
                        className="column-row-expand-icon"
                        onClick={(e) => {
                            stopPropagationAndDefault(e);
                            setExpanded(!expanded);
                        }}
                    />
                )}
                <span className="column-row-name">
                    {name.startsWith('<') ? <em>{name}</em> : name}
                </span>
                <span>
                    {icon && (
                        <ColumnIcon
                            name={icon}
                            tooltip={'Partition key'}
                            fill={false}
                        />
                    )}
                </span>
                <span className="column-row-type">{type}</span>
            </StyledColumnRow>
            {hasChildren &&
                expanded &&
                effectiveTypeChildren?.map((child) => (
                    <ColumnRow
                        key={child.key}
                        name={child.key}
                        type={child.type}
                        typeChildren={child.children}
                        onClick={onClick}
                        indent={indent + 1}
                    />
                ))}
        </>
    );
};
