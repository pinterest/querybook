import React, { useCallback } from 'react';
import { bind } from 'lodash-decorators';
import * as DraftJs from 'draft-js';

import {
    IDataTable,
    IDataColumn,
    IDataTableWarning,
    DataTableWarningSeverity,
    IPaginatedQuerySampleFilters,
} from 'const/metastore';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { generateFormattedDate } from 'lib/utils/datetime';
import { getAppName } from 'lib/utils/global';
import { titleize } from 'lib/utils';
import { getHumanReadableByteSize } from 'lib/utils/number';

import {
    DataTableStats,
    useFetchDataTableStats,
} from 'components/DataTableStats/DataTableStats';
import {
    DataTableViewQueryUsers,
    useLoadQueryUsers,
} from 'components/DataTableViewQueryExample/DataTableViewQueryUsers';
import { TextButton } from 'ui/Button/Button';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Message } from 'ui/Message/Message';
import { Table } from 'ui/Table/Table';

import './DataTableViewOverview.scss';
import { DataTableViewOverviewSection } from './DataTableViewOverviewSection';
import { LoadingRow } from 'ui/Loading/Loading';
import { DataTableViewQueryConcurrences } from 'components/DataTableViewQueryExample/DataTableViewQueryConcurrences';
import { Title } from 'ui/Title/Title';
import {
    DataTableViewQueryEngines,
    useLoadQueryEngines,
} from 'components/DataTableViewQueryExample/DataTableViewQueryEngines';

const dataTableDetailsColumns = [
    {
        accessor: 'name',
        width: 200,
    },
    { accessor: 'value' },
];

const dataTableDetailsRows = [
    'type',
    'owner',
    'table_created_at',
    'table_updated_by',
    'table_updated_at',
    'data_size_bytes',
    'latest_partitions',
    'earliest_partitions',
    'location',
    'column_count',
];

export interface IQuerybookTableViewOverviewProps {
    table: IDataTable;
    tableName: string;
    tableColumns: IDataColumn[];
    tableWarnings: IDataTableWarning[];

    onTabSelected: (key: string) => any;
    updateDataTableDescription: (
        tableId: number,
        description: DraftJs.ContentState
    ) => any;
    onExampleFilter: (params: IPaginatedQuerySampleFilters) => any;
}

export class DataTableViewOverview extends React.PureComponent<IQuerybookTableViewOverviewProps> {
    @bind
    public onDescriptionSave(description: DraftJs.ContentState) {
        const table = this.props.table;
        return this.props.updateDataTableDescription(table.id, description);
    }

    public render() {
        const { table, tableName, tableWarnings, onExampleFilter } = this.props;
        const description = table.description ? (
            <EditableTextField
                value={table.description as DraftJs.ContentState}
                onSave={this.onDescriptionSave}
            />
        ) : null;

        const detailsDOM = (
            <Table
                className="data-table-details-table"
                showHeader={false}
                rows={dataTableDetailsRows
                    .filter((row) => table[row] != null)
                    .map((row) => {
                        let value: string = '';
                        switch (row) {
                            case 'table_created_at':
                            case 'table_updated_at': {
                                value = table[row]
                                    ? generateFormattedDate(table[row])
                                    : '';
                                break;
                            }
                            case 'data_size_bytes': {
                                value = getHumanReadableByteSize(table[row]);
                                break;
                            }
                            default:
                                value = table[row];
                        }
                        return {
                            name: titleize(row, '_', ' '),
                            value,
                        };
                    })}
                showAllRows={true}
                cols={dataTableDetailsColumns}
            />
        );

        const hiveMetastoreDOM = table.hive_metastore_description ? (
            <pre>{table.hive_metastore_description}</pre>
        ) : null;

        const descriptionSection = (
            <DataTableViewOverviewSection title="Description">
                {description}
            </DataTableViewOverviewSection>
        );

        const metaSection = (
            <DataTableViewOverviewSection title="Meta info">
                <div>
                    <p>
                        First created in {getAppName()} at{' '}
                        {generateFormattedDate(table.created_at)}.
                    </p>
                    <p>
                        Last pulled from metastore at{' '}
                        {generateFormattedDate(table.updated_at)}.
                    </p>
                </div>
            </DataTableViewOverviewSection>
        );
        const detailsSection = (
            <DataTableViewOverviewSection title="Details">
                {detailsDOM}
            </DataTableViewOverviewSection>
        );

        const hiveMetastoreSection = (
            <DataTableViewOverviewSection title="Hive Metastore Raw">
                {hiveMetastoreDOM}
            </DataTableViewOverviewSection>
        );

        const sampleQueriesSection = (
            <DataTableViewOverviewSection title="Sample DataDocs">
                <TextButton
                    onClick={() =>
                        navigateWithinEnv(
                            `/search/?searchType=DataDoc&searchString=${tableName}`,
                            {
                                isModal: true,
                            }
                        )
                    }
                >
                    Click to View Sample DataDocs
                </TextButton>
            </DataTableViewOverviewSection>
        );

        const warningSection = tableWarnings.length ? (
            <DataTableViewOverviewSection title="User Warnings">
                <>
                    {tableWarnings.map((warning) => {
                        const isError =
                            warning.severity === DataTableWarningSeverity.ERROR;
                        return (
                            <Message
                                key={warning.id}
                                title={isError ? 'Error' : 'Warning'}
                                message={warning.message}
                                type={isError ? 'error' : 'warning'}
                            />
                        );
                    })}
                </>
            </DataTableViewOverviewSection>
        ) : null;

        return (
            <div className="QuerybookTableViewOverview">
                {warningSection}
                {descriptionSection}
                <TableInsightsSection
                    tableId={table.id}
                    onClick={onExampleFilter}
                />
                {detailsSection}
                <TableStatsSection tableId={table.id} />
                {hiveMetastoreSection}
                {metaSection}
                {sampleQueriesSection}
            </div>
        );
    }
}

const TableInsightsSection: React.FC<{
    tableId: number;
    onClick: (params: IPaginatedQuerySampleFilters) => any;
}> = ({ tableId, onClick }) => {
    const { loading: loadingUsers, topQueryUsers } = useLoadQueryUsers(tableId);
    const { loading: loadingEngines, queryEngines } = useLoadQueryEngines(
        tableId
    );
    const handleUserClick = useCallback(
        (uid: number) => {
            onClick({ uid });
        },
        [onClick]
    );
    const handleEngineClick = useCallback(
        (engineId: number) => {
            onClick({ engine_id: engineId });
        },
        [onClick]
    );
    const handleTableClick = useCallback(
        (tableId: number) => {
            onClick({ with_table_id: tableId });
        },
        [onClick]
    );

    return loadingUsers || loadingEngines ? (
        <LoadingRow />
    ) : topQueryUsers?.length ? (
        <DataTableViewOverviewSection title="Table Insights">
            <div>
                <Title size={6}>Frequent Users</Title>
                <DataTableViewQueryUsers
                    tableId={tableId}
                    onClick={handleUserClick}
                />
            </div>
            {queryEngines.length > 1 && (
                <div className="mt8">
                    <Title size={6}>Query Engines</Title>
                    <DataTableViewQueryEngines
                        tableId={tableId}
                        onClick={handleEngineClick}
                    />
                </div>
            )}
            <div className="mt8">
                <Title size={6}>Top Co-occurring Tables</Title>
                <DataTableViewQueryConcurrences
                    tableId={tableId}
                    onClick={handleTableClick}
                />
            </div>
        </DataTableViewOverviewSection>
    ) : null;
};

const TableStatsSection: React.FC<{
    tableId: number;
}> = ({ tableId }) => {
    const { loading, tableStats } = useFetchDataTableStats(tableId);
    return loading ? (
        <LoadingRow />
    ) : tableStats?.length ? (
        <DataTableViewOverviewSection title="Statistics">
            {<DataTableStats tableId={tableId} />}
        </DataTableViewOverviewSection>
    ) : null;
};
