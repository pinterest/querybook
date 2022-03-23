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
import './DataTableViewOverview.scss';
import { DataTableViewOverviewSection } from './DataTableViewOverviewSection';
import { LoadingRow } from 'ui/Loading/Loading';
import { DataTableViewQueryConcurrences } from 'components/DataTableViewQueryExample/DataTableViewQueryConcurrences';
import {
    DataTableViewQueryEngines,
    useLoadQueryEngines,
} from 'components/DataTableViewQueryExample/DataTableViewQueryEngines';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';

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

        const detailsDOM = dataTableDetailsRows
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
                return (
                    <KeyContentDisplay
                        key={row}
                        keyString={titleize(row, '_', ' ')}
                    >
                        {value}
                    </KeyContentDisplay>
                );
            });

        const rawMetastoreInfoDOM = table.hive_metastore_description ? (
            <pre>
                <ShowMoreText
                    seeLess
                    length={200}
                    text={table.hive_metastore_description}
                />
            </pre>
        ) : null;

        const descriptionSection = (
            <DataTableViewOverviewSection title="Description">
                {description}
            </DataTableViewOverviewSection>
        );

        const metaSection = (
            <DataTableViewOverviewSection title="Meta info">
                <KeyContentDisplay
                    key="created"
                    keyString={`First created in ${getAppName()}`}
                >
                    {generateFormattedDate(table.created_at)}
                </KeyContentDisplay>
                <KeyContentDisplay
                    key="pulled"
                    keyString="Last pulled from metastore"
                >
                    {generateFormattedDate(table.updated_at)}
                </KeyContentDisplay>
            </DataTableViewOverviewSection>
        );
        const detailsSection = (
            <DataTableViewOverviewSection title="Details">
                {detailsDOM}
            </DataTableViewOverviewSection>
        );

        const hiveMetastoreSection = (
            <DataTableViewOverviewSection title="Raw Metastore Info">
                {rawMetastoreInfoDOM}
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
                    View Sample DataDocs
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
            <div className="QuerybookTableViewOverview pb24">
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
                <div className="overview-subtitle">Frequent Users</div>
                <DataTableViewQueryUsers
                    tableId={tableId}
                    onClick={handleUserClick}
                />
            </div>
            {queryEngines.length > 1 && (
                <div className="mt16">
                    <div className="overview-subtitle">Query Engines</div>
                    <DataTableViewQueryEngines
                        tableId={tableId}
                        onClick={handleEngineClick}
                    />
                </div>
            )}
            <div className="mt16">
                <div className="overview-subtitle">Top Co-occurring Tables</div>
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
