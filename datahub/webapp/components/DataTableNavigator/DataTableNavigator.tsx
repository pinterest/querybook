import React from 'react';
import classNames from 'classnames';
import { decorate } from 'core-decorators';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import { connect } from 'react-redux';
import { withRouter, RouteComponentProps } from 'react-router-dom';

import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { IStoreState, Dispatch } from 'redux/store/types';
import {
    ITableSearchResult,
    ITableSearchFilters,
} from 'redux/dataTableSearch/types';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { IQueryMetastore } from 'const/metastore';

import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { ListLink } from 'ui/Link/ListLink';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Select, makeSelectOptions } from 'ui/Select/Select';
import { Tabs } from 'ui/Tabs/Tabs';

import './DataTableNavigator.scss';

const DATA_TABLE_TABS = [
    {
        name: 'Featured',
        key: 'golden',
    },
    {
        name: 'All',
        key: 'all',
    },
];

interface ITableResultWithSelection extends ITableSearchResult {
    selected: boolean;
}

interface IDataTableNavigatorOwnProps extends RouteComponentProps {
    onTableRowClick?: (tableId: number, e: MouseEvent) => any;
    selectedTableId?: number;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type IDataTableNavigatorProps = IDataTableNavigatorOwnProps &
    StateProps &
    DispatchProps;
interface IDataTableNavigatorState {
    selectedTabKey: string;
}

class DataTableNavigatorComponent extends React.PureComponent<
    IDataTableNavigatorProps,
    IDataTableNavigatorState
> {
    constructor(props) {
        super(props);

        const index = this.props.searchFilters['golden'] === true ? 0 : 1;
        this.state = {
            selectedTabKey: DATA_TABLE_TABS[index].key,
        };
    }

    public componentDidMount() {
        this.props.mapQueryParamToState();
        this.setDefaultMetastoreForEnvironment();
    }

    public componentDidUpdate() {
        this.setDefaultMetastoreForEnvironment();
    }

    @bind
    public setDefaultMetastoreForEnvironment() {
        this._autoClearMetastoreResults(this.props.queryMetastores.length);
        this._setDefaultMetastoreForEnvironment(
            this.props.queryMetastores,
            this.props.metastoreId
        );
    }

    @bind
    @decorate(memoizeOne)
    public _autoClearMetastoreResults(metastoreLength: number) {
        if (metastoreLength === 0) {
            this.props.resetSearch();
        }
    }

    @bind
    @decorate(memoizeOne)
    public _setDefaultMetastoreForEnvironment(
        queryMetastores: IQueryMetastore[],
        metastoreId: number
    ) {
        if (
            queryMetastores.length > 0 &&
            !queryMetastores.find((metastore) => metastore.id === metastoreId)
        ) {
            this.props.selectMetastore(queryMetastores[0].id);
        }
    }

    @bind
    public handleMetastoreChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        this.props.selectMetastore(Number(evt.target.value));
    }

    @bind
    public onSegmentChange(selectedTabKey: string) {
        let newValue = null;
        if (selectedTabKey === 'golden') {
            newValue = true;
        }
        this.setState({ selectedTabKey });
        this.props.updateSearchFilter('golden', newValue);
    }

    @bind
    public tableRowRenderer(table: ITableResultWithSelection) {
        const tableName = `${table.schema}.${table.name}`;
        const className = classNames({
            selected: table.selected,
        });

        return (
            <ListLink
                className={className}
                onClick={this.handleTableRowClick.bind(this, table.id)}
                isRow
                title={tableName}
            />
        );
    }

    @bind
    public handleTableRowClick(tableId: number, event: MouseEvent) {
        if (this.props.onTableRowClick) {
            this.props.onTableRowClick(tableId, event);
        } else {
            // default behavior
            this.props.history.push(`/table/${tableId}/`);
        }
    }

    @bind
    public handleSearch(searchString: string) {
        this.props.updateSearchString(searchString);
    }

    public render() {
        const {
            dataTables,
            searchString,
            selectedTableId,
            queryMetastores,
            metastoreId,
            numDataTables,
            isSearching,
        } = this.props;

        const metastorePicker =
            queryMetastores.length > 1 ? (
                <div className="navigator-metastore-picker">
                    <Select
                        className="small"
                        value={metastoreId}
                        onChange={this.handleMetastoreChange}
                        transparent
                    >
                        {makeSelectOptions(
                            queryMetastores.map((metastore) => ({
                                value: metastore.name,
                                key: metastore.id,
                            }))
                        )}
                    </Select>
                </div>
            ) : null;

        const searchDOM = (
            <div className="navigator-search-input">
                <SearchBar
                    value={searchString}
                    onSearch={this.handleSearch}
                    placeholder="Search by Table Name..."
                    transparent
                    delayMethod="throttle"
                />
            </div>
        );

        const tabsDOM = (
            <div>
                <Tabs
                    items={DATA_TABLE_TABS}
                    selectedTabKey={this.state.selectedTabKey}
                    onSelect={this.onSegmentChange}
                    wide
                />
            </div>
        );

        const dataTablesWithSelection: ITableResultWithSelection[] = dataTables.map(
            (table) => ({
                ...table,
                selected: selectedTableId === table.id,
            })
        );

        const tablesDOM = (
            <div className="table-scroll-wrapper">
                <InfinityScroll<ITableSearchResult>
                    elements={dataTablesWithSelection}
                    onLoadMore={this.props.getMoreDataTable}
                    hasMore={numDataTables > dataTables.length || isSearching}
                    itemRenderer={this.tableRowRenderer}
                    itemHeight={28}
                />
            </div>
        );

        return (
            <div className={'DataTableNavigator '}>
                {metastorePicker}
                {searchDOM}
                {tabsDOM}
                {tablesDOM}
            </div>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        queryMetastores: queryMetastoresSelector(state),
        dataTables: state.dataTableSearch.results,
        numDataTables: state.dataTableSearch.count,
        searchString: state.dataTableSearch.searchString,
        searchFilters: state.dataTableSearch.searchFilters,
        metastoreId: state.dataTableSearch.metastoreId,
        isSearching: !!state.dataTableSearch.searchRequest,
    };
}

const mapDispatchToProps = (dispatch: Dispatch) => {
    return {
        mapQueryParamToState: () =>
            dispatch(dataTableSearchActions.mapQueryParamToState()),
        updateSearchString: (searchString: string) =>
            dispatch(dataTableSearchActions.updateSearchString(searchString)),
        updateSearchFilter<K extends keyof ITableSearchFilters>(
            filterKey: K,
            filterVal: ITableSearchFilters[K]
        ) {
            return dispatch(
                dataTableSearchActions.updateSearchFilter(filterKey, filterVal)
            );
        },
        selectMetastore: (metastoreId: number) =>
            dispatch(dataTableSearchActions.selectMetastore(metastoreId)),
        getMoreDataTable: () =>
            dispatch(dataTableSearchActions.getMoreDataTable()),
        resetSearch: () => dispatch(dataTableSearchActions.resetSearch()),
    };
};

export const DataTableNavigator = withRouter(
    connect(mapStateToProps, mapDispatchToProps)(DataTableNavigatorComponent)
);
