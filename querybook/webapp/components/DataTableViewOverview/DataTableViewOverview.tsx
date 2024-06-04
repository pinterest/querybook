import * as DraftJs from 'draft-js';
import React, { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import {
    DataTableStats,
    useFetchDataTableStats,
} from 'components/DataTableStats/DataTableStats';
import { DataTableViewQueryConcurrences } from 'components/DataTableViewQueryExample/DataTableViewQueryConcurrences';
import {
    DataTableViewQueryEngines,
    useLoadQueryEngines,
} from 'components/DataTableViewQueryExample/DataTableViewQueryEngines';
import {
    DataTableViewQueryUsers,
    useLoadQueryUsers,
} from 'components/DataTableViewQueryExample/DataTableViewQueryUsers';
import {
    DataTableWarningSeverity,
    IDataColumn,
    IDataTable,
    IDataTableWarning,
    IPaginatedQuerySampleFilters,
} from 'const/metastore';
import { useMounted } from 'hooks/useMounted';
import { Nullable } from 'lib/typescript';
import { titleize } from 'lib/utils';
import { generateFormattedDate } from 'lib/utils/datetime';
import { getAppName } from 'lib/utils/global';
import { getHumanReadableByteSize } from 'lib/utils/number';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { refreshDataTableInMetastore } from 'redux/dataSources/action';
import { SoftButton, TextButton } from 'ui/Button/Button';
import { EditableTextField } from 'ui/EditableTextField/EditableTextField';
import { KeyContentDisplay } from 'ui/KeyContentDisplay/KeyContentDisplay';
import { KeyContentDisplayLink } from 'ui/KeyContentDisplay/KeyContentDisplayLink';
import { Link } from 'ui/Link/Link';
import { LoadingRow } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';
import { ShowMoreText } from 'ui/ShowMoreText/ShowMoreText';

import { DataTableViewOverviewSection } from './DataTableViewOverviewSection';
import { Icon } from 'ui/Icon/Icon';

import './DataTableViewOverview.scss';

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

/**
 * Any custom properties in this array will be shown on top following the order of the array
 */
const pinnedCustomProperties = ['channels'];

function useRefreshMetastore(table: IDataTable) {
    const dispatch = useDispatch();
    const isMounted = useMounted();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleRefreshTable = useCallback(() => {
        setIsRefreshing(true);
        const refreshRequest = dispatch(
            refreshDataTableInMetastore(table.id)
        ) as unknown as Promise<void>;
        refreshRequest.finally(() => {
            if (isMounted()) {
                setIsRefreshing(false);
            }
        });

        toast.promise(refreshRequest, {
            loading: 'Refreshing table from metastore',
            success: 'Successfully updated table!',
            error: 'Failed to update table from metastore',
        });
    }, [dispatch, table.id]);

    return [handleRefreshTable, isRefreshing] as const;
}

export interface IQuerybookTableViewOverviewProps {
    table: IDataTable;
    tableName: string;
    tableColumns: IDataColumn[];
    tableWarnings: IDataTableWarning[];

    onEditTableDescriptionRedirect?: Nullable<() => Promise<void>>;
    onTabSelected: (key: string) => any;
    updateDataTableDescription: (
        tableId: number,
        description: DraftJs.ContentState
    ) => any;
    onExampleFilter: (params: IPaginatedQuerySampleFilters) => any;
}

export const DataTableViewOverview: React.FC<
    IQuerybookTableViewOverviewProps
> = ({
    table,
    tableName,
    tableWarnings,
    onExampleFilter,
    updateDataTableDescription,
    onEditTableDescriptionRedirect,
}) => {
    const onDescriptionSave = useCallback(
        (description: DraftJs.ContentState) =>
            updateDataTableDescription(table.id, description),
        [updateDataTableDescription, table]
    );

    const [handleRefreshTable, isRefreshingTable] = useRefreshMetastore(table);

    const description = table.description ? (
        <EditableTextField
            value={table.description as DraftJs.ContentState}
            onSave={onDescriptionSave}
            placeholder="No description for this table yet."
            onEditRedirect={onEditTableDescriptionRedirect}
        />
    ) : null;

    const tableLinksDOM = (table.table_links ?? []).map((link, index) => (
        <div key={index}>
            <Link to={link.url} newTab className="data-table-table-links">
                <Icon name="Link" size={12} />
                {link.label ?? link.url}
            </Link>
            <br />
        </div>
    ));

    const detailsDOM = dataTableDetailsRows
        .filter((row) => table[row] != null)
        .map((row) => {
            let value: string = '';
            switch (row) {
                case 'table_created_at':
                case 'table_updated_at': {
                    value = table[row] ? generateFormattedDate(table[row]) : '';
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

    const customProperties = table.custom_properties ?? {};

    // Get pinned custom properties and display based on order of pinnedCustomProperties
    const pinnedPropertiesDOM = pinnedCustomProperties
        .filter((p) => p in customProperties)
        .map((key) => {
            const value = customProperties[key];
            return (
                <KeyContentDisplayLink
                    key={key}
                    keyString={key}
                    value={value}
                />
            );
        });

    const otherPropertiesDOM = Object.entries(customProperties)
        .filter(([key]) => !pinnedCustomProperties.includes(key))
        .map(([key, value]) => (
            <KeyContentDisplayLink key={key} keyString={key} value={value} />
        ));

    const rawMetastoreInfoDOM = table.hive_metastore_description ? (
        <pre className="raw-metastore-info">
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
            {tableLinksDOM}
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
            <SoftButton
                className="mt8"
                icon="RefreshCw"
                title="Refresh from metastore"
                onClick={handleRefreshTable}
                disabled={isRefreshingTable}
            />
        </DataTableViewOverviewSection>
    );
    const detailsSection = (
        <DataTableViewOverviewSection title="Details">
            {pinnedPropertiesDOM}
            {detailsDOM}
            {otherPropertiesDOM}
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
};

const TableInsightsSection: React.FC<{
    tableId: number;
    onClick: (params: IPaginatedQuerySampleFilters) => any;
}> = ({ tableId, onClick }) => {
    const { loading: loadingUsers, topQueryUsers } = useLoadQueryUsers(tableId);
    const { loading: loadingEngines, queryEngines } =
        useLoadQueryEngines(tableId);
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
