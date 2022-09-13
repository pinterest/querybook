import { decorate } from 'core-decorators';
import { snakeCase } from 'lodash';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';

import { DataTableViewBoards } from 'components/DataTableViewBoards/DataTableViewBoards';
import { DataTableViewColumn } from 'components/DataTableViewColumn/DataTableViewColumn';
import { DataTableViewLineage } from 'components/DataTableViewLineage/DataTableViewLineage';
import { DataTableViewOverview } from 'components/DataTableViewOverview/DataTableViewOverview';
import { DataTableViewQueryExamples } from 'components/DataTableViewQueryExample/DataTableViewQueryExamples';
import { DataTableViewSamples } from 'components/DataTableViewSamples/DataTableViewSamples';
import { DataTableViewSourceQuery } from 'components/DataTableViewSourceQuery/DataTableViewSourceQuery';
import { DataTableViewWarnings } from 'components/DataTableViewWarnings/DataTableViewWarnings';
import { IPaginatedQuerySampleFilters } from 'const/metastore';
import { setBrowserTitle } from 'lib/querybookUI';
import history from 'lib/router-history';
import { sanitizeUrlTitle } from 'lib/utils';
import { formatError } from 'lib/utils/error';
import NOOP from 'lib/utils/noop';
import { getQueryString, replaceQueryString } from 'lib/utils/query-string';
import * as dataSourcesActions from 'redux/dataSources/action';
import { fullTableSelector } from 'redux/dataSources/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
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
    },
    {
        name: 'Columns',
        key: 'columns',
    },
    {
        name: 'Row Samples',
        key: 'row_samples',
    },
    {
        name: 'Lineage',
        key: 'lineage',
    },
    {
        name: 'Source Query',
        key: 'source_query',
    },
    {
        name: 'Query Examples',
        key: 'query_examples',
    },
    {
        name: 'Lists',
        key: 'lists',
    },
    {
        name: 'Warnings',
        key: 'warnings',
    },
];

interface IDataTableViewOwnProps extends RouteComponentProps {
    tableId: number;
}

type DataTableViewStateProps = ReturnType<typeof mapStateToProps>;
type DataTableViewDispatchProps = ReturnType<typeof mapDispatchToProps>;

export type IDataTableViewProps = IDataTableViewOwnProps &
    DataTableViewStateProps &
    DataTableViewDispatchProps;

export interface IDataTableViewState {
    selectedTabKey: string;
}

class DataTableViewComponent extends React.PureComponent<
    IDataTableViewProps,
    IDataTableViewState
> {
    public readonly state = {
        selectedTabKey: this.getInitialTabKey(),
    };

    @decorate(memoizeOne)
    public publishDataTableTitle(title: string) {
        if (title) {
            setBrowserTitle(title);
            history.replace(
                location.pathname.split('/').slice(0, 4).join('/') +
                    `/${sanitizeUrlTitle(title)}/` +
                    location.search +
                    location.hash,
                this.props.location.state
            );
        }
    }

    @bind
    public getInitialTabKey() {
        const queryParam = getQueryString();
        return queryParam['tab'] || snakeCase(tabDefinitions[0].key);
    }

    @bind
    public getInitialTabs() {
        const tabs = tabDefinitions;
        return tabs.map((tab) => ({
            name: tab.name,
            key: tab.key,
            onClick: this.onTabSelected.bind(this, tab.key),
        }));
    }

    @bind
    public onTabSelected(key) {
        // Temporal
        replaceQueryString({ tab: key });
        this.setState({ selectedTabKey: key });
    }

    @bind
    public handleExampleFilter(params: IPaginatedQuerySampleFilters) {
        replaceQueryString({
            tab: 'query_examples',
            ...params,
        });
        this.setState({ selectedTabKey: 'query_examples' });
    }

    @bind
    public makeOverviewDOM() {
        const { table, tableName, tableColumns, tableWarnings } = this.props;

        return (
            <DataTableViewOverview
                table={table}
                tableName={tableName}
                tableColumns={tableColumns}
                tableWarnings={tableWarnings}
                onTabSelected={this.onTabSelected}
                updateDataTableDescription={this.updateDataTableDescription}
                onExampleFilter={this.handleExampleFilter}
            />
        );
    }

    @bind
    public makeColumnsDOM(numberOfRows = null) {
        const { table, tableColumns, updateDataColumnDescription } = this.props;

        return (
            <DataTableViewColumn
                table={table}
                tableColumns={tableColumns}
                numberOfRows={numberOfRows}
                updateDataColumnDescription={updateDataColumnDescription}
            />
        );
    }

    @bind
    public makeSamplesDOM(numberOfRows: number) {
        const { table, schema, tableColumns } = this.props;

        return (
            <Loader item={table} itemLoader={NOOP}>
                <DataTableViewSamples
                    table={table}
                    schema={schema}
                    tableColumns={tableColumns}
                />
            </Loader>
        );
    }

    @bind
    public makeBoardsDOM() {
        const { table } = this.props;
        return (
            <Loader item={table} itemLoader={NOOP}>
                <DataTableViewBoards table={table} />
            </Loader>
        );
    }

    @bind
    public makeWarningsDOM() {
        const { tableWarnings, table } = this.props;
        return (
            <Loader item={table} itemLoader={NOOP}>
                <DataTableViewWarnings
                    tableWarnings={tableWarnings}
                    tableId={table.id}
                />
            </Loader>
        );
    }

    @bind
    public makeLineageDOM() {
        const { table, dataLineages, loadDataLineages } = this.props;

        return (
            <Loader
                item={dataLineages}
                itemLoader={loadDataLineages.bind(null, table.id)}
            >
                <DataTableViewLineage
                    dataLineageLoader={loadDataLineages}
                    table={table}
                    dataLineages={dataLineages}
                />
            </Loader>
        );
    }

    @bind
    public updateDataTableDescription(tableId: number, description) {
        this.props.updateDataTable(tableId, { description });
    }

    @bind
    public updateDataTableGolden(golden: boolean) {
        this.props.updateDataTable(this.props.tableId, { golden });
    }

    @bind
    public makeQueryDOM() {
        const {
            table,
            dataJobMetadataById,
            dataLineages,
            loadDataJobMetadata,
            loadDataLineages,
        } = this.props;

        return (
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
    }

    @bind
    public makeQueryExamplesDOM() {
        return <DataTableViewQueryExamples tableId={this.props.tableId} />;
    }

    public componentDidMount() {
        this.props.getTable(this.props.tableId);
        this.publishDataTableTitle(this.props.tableName);
    }

    public componentDidUpdate(prevProps) {
        if (
            this.props.tableName &&
            prevProps.tableName !== this.props.tableName
        ) {
            this.publishDataTableTitle(this.props.tableName);
        }
    }

    public render() {
        const { table, tableId, getTable } = this.props;

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
                {this.renderTableView()}
            </Loader>
        );
    }

    public renderTableView() {
        const { selectedTabKey } = this.state;
        const { tableName, table, userInfo } = this.props;

        if (!table) {
            return;
        }

        const rendererByTab = {
            overview: this.makeOverviewDOM,
            columns: this.makeColumnsDOM,
            row_samples: this.makeSamplesDOM,
            lineage: this.makeLineageDOM,
            source_query: this.makeQueryDOM,
            query_examples: this.makeQueryExamplesDOM,
            lists: this.makeBoardsDOM,
            warnings: this.makeWarningsDOM,
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
                    updateDataTableGolden={this.updateDataTableGolden}
                />
                <Tabs
                    items={tabDefinitions}
                    selectedTabKey={selectedTabKey}
                    onSelect={this.onTabSelected}
                    className="DataTableView-tabs"
                    wide
                    selectColor
                />
                <div className="DataTableView-content mt16">{contentDOM}</div>
            </Container>
        );
    }
}

function mapStateToProps(state: IStoreState, ownProps) {
    const {
        dataJobMetadataById,
        dataTablesById,
        dataLineages,
        dataSchemasById,
    } = state.dataSources;

    const { tableId } = ownProps;

    const { table, schema, tableName, tableColumns, tableWarnings } =
        fullTableSelector(state, tableId);

    return {
        table,
        schema,
        tableName,
        tableColumns,

        dataLineages,
        dataTablesById,
        dataJobMetadataById,
        dataSchemasById,
        tableWarnings,

        userInfo: state.user.myUserInfo,
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps) {
    return {
        getTable: (tableId) =>
            dispatch(dataSourcesActions.fetchDataTableIfNeeded(tableId)),

        loadDataJobMetadata: (dataJobMetadataId) => {
            dispatch(
                dataSourcesActions.fetchDataJobMetadataIfNeeded(
                    dataJobMetadataId
                )
            );
        },

        updateDataTable: (tableId, params) =>
            dispatch(dataSourcesActions.updateDataTable(tableId, params)),

        updateDataColumnDescription: (columnId, description) =>
            dispatch(
                dataSourcesActions.updateDataColumnDescription(
                    columnId,
                    description
                )
            ),
        loadDataLineages: (tableId) =>
            dispatch(dataSourcesActions.fetchDataLineage(tableId)),
    };
}

export const DataTableView = withRouter<IDataTableViewOwnProps>(
    connect(mapStateToProps, mapDispatchToProps)(DataTableViewComponent)
);
