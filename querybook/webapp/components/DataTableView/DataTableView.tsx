import { ContentState } from 'draft-js';
import { snakeCase } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { DataTableViewBoards } from 'components/DataTableViewBoards/DataTableViewBoards';
import { DataTableViewColumn } from 'components/DataTableViewColumn/DataTableViewColumn';
import { DataTableViewLineage } from 'components/DataTableViewLineage/DataTableViewLineage';
import { DataTableViewOverview } from 'components/DataTableViewOverview/DataTableViewOverview';
import { DataTableViewQueryExamples } from 'components/DataTableViewQueryExample/DataTableViewQueryExamples';
import { DataTableViewSamples } from 'components/DataTableViewSamples/DataTableViewSamples';
import { DataTableViewSourceQuery } from 'components/DataTableViewSourceQuery/DataTableViewSourceQuery';
import { DataTableViewWarnings } from 'components/DataTableViewWarnings/DataTableViewWarnings';
import { ComponentType, ElementType } from 'const/analytics';
import {
    IPaginatedQuerySampleFilters,
    IUpdateTableParams,
    MetadataMode,
    MetadataType,
} from 'const/metastore';
import { SurveySurfaceType } from 'const/survey';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';
import { useTrackView } from 'hooks/useTrackView';
import { trackClick } from 'lib/analytics';
import { setBrowserTitle } from 'lib/querybookUI';
import history from 'lib/router-history';
import { sanitizeUrlTitle } from 'lib/utils';
import { formatError } from 'lib/utils/error';
import NOOP from 'lib/utils/noop';
import { getQueryString, replaceQueryString } from 'lib/utils/query-string';
import * as dataSourcesActions from 'redux/dataSources/action';
import { fullTableSelector } from 'redux/dataSources/selector';
import { TableResource } from 'resource/table';
import { Container } from 'ui/Container/Container';
import { ErrorPage } from 'ui/ErrorPage/ErrorPage';
import { FourOhFour } from 'ui/ErrorPage/FourOhFour';
import { Loader } from 'ui/Loader/Loader';
import { Tabs } from 'ui/Tabs/Tabs';

import { DataTableHeader } from './DataTableHeader';

import './DataTableView.scss';

const tabDefinitions = [
    {
        name: 'Overview',
        key: 'overview',
        elementType: ElementType.OVERVIEW_TABLE_TAB,
    },
    {
        name: 'Columns',
        key: 'columns',
        elementType: ElementType.COLUMNS_TABLE_TAB,
    },
    {
        name: 'Row Samples',
        key: 'row_samples',
        elementType: ElementType.ROW_SAMPLES_TABLE_TAB,
    },
    {
        name: 'Lineage',
        key: 'lineage',
        elementType: ElementType.LINEAGE_TABLE_TAB,
    },
    {
        name: 'Source Query',
        key: 'source_query',
        elementType: ElementType.SOURCE_QUERY_TABLE_TAB,
    },
    {
        name: 'Query Examples',
        key: 'query_examples',
        elementType: ElementType.QUERY_EXAMPLES_TABLE_TAB,
    },
    {
        name: 'Lists',
        key: 'lists',
        elementType: ElementType.LISTS_TABLE_TAB,
    },
    {
        name: 'Warnings',
        key: 'warnings',
        elementType: ElementType.WARNINGS_TABLE_TAB,
    },
];

export interface IDataTableViewProps {
    tableId: number;
}

export interface IDataTableViewState {
    selectedTabKey: string;
}

export const DataTableView: React.FC<IDataTableViewProps> = ({ tableId }) => {
    const {
        table,
        schema,
        tableName,
        tableColumns,
        dataLineages,
        dataJobMetadataById,
        tableWarnings,
        metastore,

        userInfo,
    } = useShallowSelector((state) => {
        const { dataJobMetadataById, dataLineages } = state.dataSources;

        const {
            table,
            schema,
            tableName,
            tableColumns,
            tableWarnings,
            metastore,
        } = fullTableSelector(state, tableId);

        return {
            table,
            schema,
            tableName,
            tableColumns,

            dataLineages,
            dataJobMetadataById,
            tableWarnings,
            metastore,

            userInfo: state.user.myUserInfo,
        };
    });
    const dispatch = useDispatch();
    const getTable = useCallback(
        (tableId: number) =>
            dispatch(dataSourcesActions.fetchDataTableIfNeeded(tableId)),
        [dispatch]
    );

    const loadDataJobMetadata = useCallback(
        (dataJobMetadataId: number) => {
            dispatch(
                dataSourcesActions.fetchDataJobMetadataIfNeeded(
                    dataJobMetadataId
                )
            );
        },
        [dispatch]
    );

    const updateDataTable = useCallback(
        (tableId: number, params: IUpdateTableParams) =>
            dispatch(dataSourcesActions.updateDataTable(tableId, params)),
        [dispatch]
    );

    const updateDataColumnDescription = useCallback(
        (columnId: number, description: ContentState) =>
            dispatch(
                dataSourcesActions.updateDataColumnDescription(
                    columnId,
                    description
                )
            ),
        [dispatch]
    );
    const loadDataLineages = useCallback(
        (tableId: number) =>
            dispatch(dataSourcesActions.fetchDataLineage(tableId)),
        [dispatch]
    );

    const [selectedTabKey, setSelectedTabKey] = useState<string>(() => {
        const queryParam = getQueryString();
        return queryParam['tab'] || snakeCase(tabDefinitions[0].key);
    });

    useTrackView(ComponentType.TABLE_DETAIL_VIEW);
    const triggerSurvey = useSurveyTrigger(true);
    useEffect(() => {
        if (!tableId || !tableName) {
            return;
        }
        triggerSurvey(SurveySurfaceType.TABLE_TRUST, {
            table_id: tableId,
            table_name: tableName,
        });
    }, [tableId, tableName, triggerSurvey]);

    useEffect(() => {
        getTable(tableId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableId]);

    const location = useLocation();
    useEffect(() => {
        if (tableName) {
            setBrowserTitle(tableName);
            history.replace(
                location.pathname.split('/').slice(0, 4).join('/') +
                    `/${sanitizeUrlTitle(tableName)}/` +
                    location.search +
                    location.hash,
                location.state
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tableName]);

    const handleEditMetadata = useCallback(
        async (metadataType: MetadataType) => {
            const { data: link } = await TableResource.getMetastoreLink(
                tableId,
                metadataType
            );
            window.open(link, '_blank');
        },
        [tableId]
    );

    const getOnEditMetadata = useCallback(
        (metadataType: MetadataType) =>
            metastore.config[metadataType] === MetadataMode.READ_ONLY
                ? () => handleEditMetadata(metadataType)
                : undefined,
        [handleEditMetadata, metastore?.config]
    );

    const handleTabSelected = useCallback((key: string) => {
        const elementType = tabDefinitions.find(
            (t) => t.key === key
        ).elementType;
        trackClick({
            component: ComponentType.TABLE_DETAIL_VIEW,
            element: elementType,
        });
        // Temporal
        replaceQueryString({ tab: key });
        setSelectedTabKey(key);
    }, []);

    const handleExampleFilter = useCallback(
        (params: IPaginatedQuerySampleFilters) => {
            replaceQueryString({
                tab: 'query_examples',
                ...params,
            });
            setSelectedTabKey('query_examples');
        },
        []
    );

    const updateDataTableDescription = useCallback(
        (tableId: number, description) =>
            updateDataTable(tableId, { description }),
        [updateDataTable]
    );

    const updateDataTableGolden = useCallback(
        (golden: boolean) => updateDataTable(tableId, { golden }),
        [tableId, updateDataTable]
    );

    const makeOverviewDOM = () => (
        <DataTableViewOverview
            table={table}
            tableName={tableName}
            tableColumns={tableColumns}
            tableWarnings={tableWarnings}
            onTabSelected={handleTabSelected}
            updateDataTableDescription={updateDataTableDescription}
            onExampleFilter={handleExampleFilter}
            onEditTableDescriptionRedirect={getOnEditMetadata(
                MetadataType.TABLE_DESCRIPTION
            )}
        />
    );

    const makeColumnsDOM = (numberOfRows = null) => (
        <DataTableViewColumn
            table={table}
            numberOfRows={numberOfRows}
            updateDataColumnDescription={updateDataColumnDescription}
            onEditColumnDescriptionRedirect={getOnEditMetadata(
                MetadataType.COLUMN_DESCRIPTION
            )}
        />
    );

    const makeSamplesDOM = () => (
        <Loader item={table} itemLoader={NOOP}>
            <DataTableViewSamples
                table={table}
                schema={schema}
                tableColumns={tableColumns}
            />
        </Loader>
    );

    const makeBoardsDOM = () => (
        <Loader item={table} itemLoader={NOOP}>
            <DataTableViewBoards table={table} />
        </Loader>
    );

    const makeWarningsDOM = () => (
        <Loader item={table} itemLoader={NOOP}>
            <DataTableViewWarnings
                tableWarnings={tableWarnings}
                tableId={table.id}
            />
        </Loader>
    );

    const makeLineageDOM = () => (
        <Loader
            item={dataLineages}
            itemLoader={() => loadDataLineages(table.id)}
        >
            <DataTableViewLineage
                dataLineageLoader={loadDataLineages}
                table={table}
                dataLineages={dataLineages}
            />
        </Loader>
    );

    const makeQueryDOM = () => (
        <Loader
            item={dataLineages.parentLineage[table.id]}
            itemLoader={loadDataLineages.bind(null, table.id)}
            itemKey={table.id}
        >
            <DataTableViewSourceQuery
                table={table}
                dataJobMetadataById={dataJobMetadataById}
                dataLineages={dataLineages}
                loadDataJobMetadata={loadDataJobMetadata}
            />
        </Loader>
    );

    const makeQueryExamplesDOM = () => (
        <DataTableViewQueryExamples tableId={tableId} />
    );

    const renderTableView = () => {
        if (!table) {
            return;
        }

        const rendererByTab = {
            overview: makeOverviewDOM,
            columns: makeColumnsDOM,
            row_samples: makeSamplesDOM,
            lineage: makeLineageDOM,
            source_query: makeQueryDOM,
            query_examples: makeQueryExamplesDOM,
            lists: makeBoardsDOM,
            warnings: makeWarningsDOM,
        };

        const contentDOM =
            selectedTabKey in rendererByTab ? (
                rendererByTab[selectedTabKey]()
            ) : (
                <FourOhFour />
            );

        return (
            <Container className="DataTableView with-background" flex="column">
                <DataTableHeader
                    table={table}
                    tableName={tableName}
                    userInfo={userInfo}
                    metastore={metastore}
                    updateDataTableGolden={updateDataTableGolden}
                />
                <Tabs
                    items={tabDefinitions}
                    selectedTabKey={selectedTabKey}
                    onSelect={handleTabSelected}
                    className="DataTableView-tabs"
                    wide
                    selectColor
                />
                <div className="DataTableView-content mt16">{contentDOM}</div>
            </Container>
        );
    };

    return (
        <Loader
            item={table}
            itemKey={tableId}
            itemLoader={getTable.bind(null, tableId)}
            emptyRenderer={() => (
                <FourOhFour>
                    Table doesn't exist or has been deleted from Metastore
                </FourOhFour>
            )}
            errorRenderer={(error) => (
                <ErrorPage
                    errorCode={error.response?.status}
                    errorMessage={formatError(error)}
                />
            )}
        >
            {renderTableView()}
        </Loader>
    );
};
