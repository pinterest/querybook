import React from 'react';
import { bind } from 'lodash-decorators';
import * as DraftJs from 'draft-js';

import {
    IDataTable,
    IDataColumn,
    IDataTableWarning,
    DataTableWarningSeverity,
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
import { Button } from 'ui/Button/Button';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { Message } from 'ui/Message/Message';
import { Table } from 'ui/Table/Table';

import './DataTableViewOverview.scss';
import { DataTableViewOverviewSection } from './DataTableViewOverviewSection';
import { LoadingRow } from 'ui/Loading/Loading';

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
    onExampleUidFilter: (uid: number) => any;
}

export class DataTableViewOverview extends React.PureComponent<
    IQuerybookTableViewOverviewProps
> {
    @bind
    public onDescriptionSave(description: DraftJs.ContentState) {
        const table = this.props.table;
        return this.props.updateDataTableDescription(table.id, description);
    }

    public render() {
        const {
            table,
            tableName,
            tableWarnings,
            onExampleUidFilter,
        } = this.props;
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
                <Button
                    onClick={() =>
                        navigateWithinEnv(
                            `/search/?searchType=DataDoc&searchString=${tableName}`,
                            {
                                isModal: true,
                            }
                        )
                    }
                    type="inlineText"
                    borderless
                >
                    Click to View Sample DataDocs
                </Button>
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
                <FrequentUsersSection
                    tableId={table.id}
                    onClick={onExampleUidFilter}
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

const FrequentUsersSection: React.FC<{
    tableId: number;
    onClick: (uid: number) => any;
}> = ({ tableId, onClick }) => {
    const { loading, topQueryUsers } = useLoadQueryUsers(tableId);
    return loading ? (
        <LoadingRow />
    ) : topQueryUsers?.length ? (
        <DataTableViewOverviewSection title="Frequent Users">
            <DataTableViewQueryUsers tableId={tableId} onClick={onClick} />
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
