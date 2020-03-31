import React from 'react';
import moment from 'moment';
import { useSelector, useDispatch } from 'react-redux';
import { IStoreState } from 'redux/store/types';
import {
    RESULT_PER_PAGE,
    SearchOrder,
    SearchType,
    IDataDocPreview,
    ITablePreview,
} from 'redux/search/types';

import { getCurrentEnv } from 'lib/utils/query-string';
import * as searchActions from 'redux/search/action';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';

import { UserSelect } from 'components/UserSelect/UserSelect';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { DataDocItem, DataTableItem } from './SearchResultItem';

import { Button } from 'ui/Button/Button';
import { Checkbox } from 'ui/Form/Checkbox';
import { DropdownMenu } from 'ui/DropdownMenu/DropdownMenu';
import { Icon } from 'ui/Icon/Icon';
import { Level } from 'ui/Level/Level';
import { Pagination } from 'ui/Pagination/Pagination';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Select } from 'ui/Select/Select';
import { Tabs } from 'ui/Tabs/Tabs';

import './SearchOverview.scss';
import { Container } from 'ui/Container/Container';

const secondsPerDay = 60 * 60 * 24;

export const SearchOverview: React.FunctionComponent = () => {
    const {
        resultByPage,
        currentPage,
        numberOfResult,

        searchString,
        searchFilters,
        searchOrder,
        searchType,
        searchAuthorChoices,

        searchRequest,
        queryMetastores,
        metastoreId,
    } = useSelector((state: IStoreState) => {
        return {
            ...state.search,
            environment: currentEnvironmentSelector(state),
            queryMetastores: queryMetastoresSelector(state),
            metastoreId: state.dataTableSearch.metastoreId,
        };
    });
    const results = resultByPage[currentPage] || [];
    const isLoading = !!searchRequest;

    const minDate = results.length
        ? Math.floor(
              Math.min.apply(
                  Math,
                  results.map((result) => result.created_at)
              ) / secondsPerDay
          ) * secondsPerDay
        : null;
    const maxDate = results.length
        ? Math.ceil(
              Math.max.apply(
                  Math,
                  results.map((result) => result.created_at)
              ) / secondsPerDay
          ) * secondsPerDay
        : null;

    const dispatch = useDispatch();
    const handleUpdateSearchString = React.useCallback(
        (searchStringParam: string) => {
            dispatch(searchActions.updateSearchString(searchStringParam));
        },
        []
    );
    const updateSearchFilter = React.useCallback((filterKey, filterValue) => {
        dispatch(searchActions.updateSearchFilter(filterKey, filterValue));
    }, []);
    const updateSearchOrder = React.useCallback((orderKey) => {
        dispatch(searchActions.updateSearchOrder(orderKey));
    }, []);
    const updateSearchType = React.useCallback((type) => {
        dispatch(searchActions.updateSearchType(type));
    }, []);
    const moveToPage = React.useCallback((page) => {
        dispatch(searchActions.moveToPage(page));
    }, []);
    const mapQueryParamToState = React.useCallback(() => {
        dispatch(searchActions.mapQueryParamToState());
    }, []);

    const addSearchAuthorChoice = React.useCallback(
        (id: number, name: string) => {
            dispatch(searchActions.addSearchAuthorChoice(id, name));
        },
        []
    );
    const selectMetastore = React.useCallback((newMetastoreId: number) => {
        dispatch(dataTableSearchActions.selectMetastore(newMetastoreId));
    }, []);

    const SEARCH_TABS = queryMetastores.length
        ? [
              {
                  name: 'DataDoc',
                  key: SearchType.DataDoc,
              },
              {
                  name: 'Tables',
                  key: SearchType.Table,
              },
          ]
        : [
              {
                  name: 'DataDoc',
                  key: SearchType.DataDoc,
              },
          ];

    const [showAddSearchAuthor, setShowAddSearchAuthor] = React.useState(false);

    const onSearchTabSelect = React.useCallback((newSearchType: string) => {
        updateSearchType(newSearchType);
        handleUpdateSearchString('');
    }, []);

    const toggleShowAddSearchAuthor = React.useCallback(() => {
        setShowAddSearchAuthor(!showAddSearchAuthor);
    }, []);

    const handleMetastoreChange = React.useCallback(
        (evt: React.ChangeEvent<HTMLSelectElement>) => {
            selectMetastore(Number(evt.target.value));
        },
        []
    );

    const onStartDateChange = React.useCallback((evt) => {
        const newDate = Number(moment(evt.target.value).format('X'));
        updateSearchFilter('startDate', isNaN(newDate) ? null : newDate);
    }, []);

    const onEndDateChange = React.useCallback((evt) => {
        const newDate = Number(moment(evt.target.value).format('X'));

        updateSearchFilter('endDate', isNaN(newDate) ? null : newDate);
    }, []);

    const getSearchBarDOM = () => {
        const placeholder =
            searchType === SearchType.DataDoc
                ? 'Search data docs'
                : 'Search tables';
        return (
            <div className="search-bar-wrapper flex-row">
                <SearchBar
                    className="SearchBar"
                    value={searchString}
                    onSearch={handleUpdateSearchString}
                    isSearching={isLoading}
                    hasIcon={isLoading}
                    hasClearSearch={true}
                    placeholder={placeholder}
                    transparent
                    autoFocus
                />
            </div>
        );
    };

    React.useEffect(() => {
        mapQueryParamToState();
    }, []);

    const searchTypeDOM = (
        <div className="search-types">
            <Tabs
                items={SEARCH_TABS}
                selectedTabKey={searchType}
                onSelect={onSearchTabSelect}
            />
        </div>
    );

    const metastoreSelectDOM =
        searchType === SearchType.Table ? (
            <div className="tables-search-select">
                <Select
                    value={metastoreId || queryMetastores[0].id}
                    onChange={handleMetastoreChange}
                    transparent
                >
                    {queryMetastores.map((metastore) => {
                        return (
                            <option key={metastore.id} value={metastore.id}>
                                {metastore.name}
                            </option>
                        );
                    })}
                </Select>
            </div>
        ) : null;

    const orderByButtonFormatter = React.useCallback(() => {
        return (
            <span>
                {searchOrder === SearchOrder.Recency
                    ? 'Most recent'
                    : 'Most relevant'}
                &nbsp;
                <i className="fa fa-caret-down caret-icon" />
            </span>
        );
    }, [searchOrder]);

    const orderByDOM = (
        <DropdownMenu
            customButtonRenderer={orderByButtonFormatter}
            items={[SearchOrder.Recency, SearchOrder.Relevance].map(
                (choice, index) => ({
                    name:
                        choice === 'Recency' ? 'Most recent' : 'Most relevant',
                    onClick:
                        searchOrder === choice
                            ? null
                            : updateSearchOrder.bind(null, choice),
                    checked: searchOrder === choice,
                })
            )}
            type="select"
            className="is-right"
        />
    );

    const environment = getCurrentEnv();
    const resultsDOM =
        searchType === SearchType.DataDoc
            ? (results as IDataDocPreview[]).map((result) => (
                  <DataDocItem
                      searchString={searchString}
                      key={result.id}
                      preview={result}
                      url={`/${environment.name}/datadoc/${result.id}/`}
                  />
              ))
            : (results as ITablePreview[]).map((result) => (
                  <DataTableItem
                      key={result.id}
                      preview={result}
                      url={`/${environment.name}/table/${result.id}/`}
                      searchString={searchString}
                  />
              ));

    const paginationDOM = numberOfResult > RESULT_PER_PAGE && (
        <Pagination
            currentPage={currentPage}
            totalPage={Math.min(
                30,
                Math.ceil(numberOfResult / RESULT_PER_PAGE)
            )}
            onPageClick={moveToPage}
        />
    );

    const dateFilterDOM = (
        <div className="filter-date">
            <div className="search-date-picker horizontal-space-between">
                <span>start</span>
                <input
                    id="start-date"
                    type="date"
                    value={undefined}
                    onChange={(event) => onStartDateChange(event)}
                />
            </div>
            <div className="search-date-picker horizontal-space-between">
                <span>end</span>
                <input
                    id="end-date"
                    type="date"
                    value={undefined}
                    onChange={(event) => onEndDateChange(event)}
                />
            </div>
        </div>
    );

    const getAuthorFiltersDOM = React.useCallback(() => {
        const filterVal = searchFilters['owner_uid'];

        const options = searchAuthorChoices.map(({ id, name }) => {
            const checked = filterVal === id;
            return (
                <div className="data-doc-filter-owner" key={id}>
                    <span className="tiny-avatar">
                        <UserAvatar uid={id} tiny />
                    </span>
                    <span className="filter-owner-name">{name}</span>
                    <Checkbox
                        value={checked}
                        onChange={updateSearchFilter.bind(
                            null,
                            'owner_uid',
                            checked ? null : id
                        )}
                    />
                </div>
            );
        });

        const addAuthorDOM = showAddSearchAuthor ? (
            <div className="add-authors">
                <UserSelect
                    onSelect={(uid, name) => {
                        addSearchAuthorChoice(uid, name);
                        updateSearchFilter('owner_uid', uid);
                        toggleShowAddSearchAuthor();
                    }}
                    selectProps={{ autoFocus: true }}
                    clearAfterSelect
                />
            </div>
        ) : (
            <Button
                onClick={toggleShowAddSearchAuthor}
                className="add-authors"
                icon="plus"
                title="more authors"
                borderless
                small
            />
        );

        return (
            <>
                {options}
                {addAuthorDOM}
            </>
        );
    }, [searchAuthorChoices, showAddSearchAuthor, searchFilters]);

    const FilterDOM =
        searchType === 'DataDoc' ? (
            <>
                <div className="search-filter">
                    <span className="filter-title">
                        Authors
                        <div className="dh-hr" />
                    </span>
                    {getAuthorFiltersDOM()}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Date
                        <div className="dh-hr" />
                    </span>
                    {minDate && maxDate && dateFilterDOM}
                </div>
            </>
        ) : (
            <>
                <div className="search-filter">
                    <span className="filter-title">
                        Metastore
                        <div className="dh-hr" />
                    </span>
                    {metastoreSelectDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Featured
                        <div className="dh-hr" />
                    </span>
                    <div className="result-item-golden horizontal-space-between">
                        <span>
                            <span>featured only</span>
                            <Icon className="award" name="award" />
                        </span>
                        <Checkbox
                            value={!!searchFilters.golden}
                            onChange={updateSearchFilter.bind(
                                null,
                                'golden',
                                searchFilters.golden ? null : true
                            )}
                        />
                    </div>
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Date
                        <div className="dh-hr" />
                    </span>
                    {dateFilterDOM}
                </div>
            </>
        );

    const instructionsTipDOM = (
        <Level className="search-instructions-tip">
            <div className="search-instructions">
                <span className="search-instructions-span">
                    <span className="instructions-key">esc</span>
                    to dismiss
                </span>
            </div>
            <div className="search-tip">
                <span className="instructions-key">⌘</span>
                <span className="search-tip-plus">+</span>
                <span className="instructions-key">K</span>
                to open this faster
            </div>
        </Level>
    );

    const searchBodyDOM = (
        <Container className="search-body" flex={'row'}>
            <div className="search-results">
                <div className="search-result-top horizontal-space-between">
                    <span className="search-result-count">
                        {numberOfResult}{' '}
                        {numberOfResult === 1 ? 'result' : 'results'}
                    </span>
                    <span>{orderByDOM}</span>
                </div>
                {resultsDOM}
                {paginationDOM}
            </div>
            <div className="search-filters">
                <div className="search-filters-by">Filter by</div>
                {FilterDOM}
            </div>
        </Container>
    );

    return (
        <div className="SearchOverview">
            {searchTypeDOM}
            {getSearchBarDOM()}
            {searchBodyDOM}
            {instructionsTipDOM}
        </div>
    );
};
