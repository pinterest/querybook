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
import {
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import * as searchActions from 'redux/search/action';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';

import { UserSelect } from 'components/UserSelect/UserSelect';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { DataDocItem, DataTableItem } from './SearchResultItem';

import { Button } from 'ui/Button/Button';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Level } from 'ui/Level/Level';
import { ListMenu } from 'ui/Menu/ListMenu';
import { Pagination } from 'ui/Pagination/Pagination';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Select } from 'ui/Select/Select';
import { Tabs } from 'ui/Tabs/Tabs';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';

import './SearchOverview.scss';
import { TableTagGroupSelect } from 'components/DataTableTags/TableTagGroupSelect';
import { SearchDatePicker } from './SearchDatePicker';

const secondsPerDay = 60 * 60 * 24;

const userReactSelectStyle = makeReactSelectStyle(true, miniReactSelectStyles);
export const SearchOverview: React.FunctionComponent = () => {
    const {
        resultByPage,
        currentPage,
        numberOfResult,

        searchString,
        searchFilters,
        searchFields,
        searchOrder,
        searchType,
        searchAuthorChoices,

        searchRequest,
        queryMetastores,
        metastoreId,
    } = useSelector((state: IStoreState) => ({
        ...state.search,
        environment: currentEnvironmentSelector(state),
        queryMetastores: queryMetastoresSelector(state),
        metastoreId: state.dataTableSearch.metastoreId,
    }));

    const results = resultByPage[currentPage] || [];
    const isLoading = !!searchRequest;

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
    const updateSearchField = React.useCallback((field) => {
        dispatch(searchActions.updateSearchField(field));
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

    const searchSettingsDOM = (
        <div className="search-settings">
            {['table_name', 'description', 'column'].map((setting) => {
                const label = setting.replace(/_/g, ' ');
                return (
                    <div
                        className="search-settings-toggle horizontal-space-between"
                        key={setting}
                    >
                        <span>
                            <span>{label}</span>
                        </span>
                        <Checkbox
                            value={!!searchFields[setting]}
                            onChange={updateSearchField.bind(null, setting)}
                        />
                    </div>
                );
            })}
        </div>
    );

    const updateTags = React.useCallback(
        (newTags: string[]) => {
            updateSearchFilter('tags', newTags.length ? newTags : null);
        },
        [updateSearchFilter]
    );

    const tagDOM = (
        <TableTagGroupSelect
            tags={searchFilters?.tags}
            updateTags={updateTags}
        />
    );

    const metastoreSelectDOM =
        searchType === SearchType.Table ? (
            <div className="tables-search-select">
                <Select
                    value={metastoreId || queryMetastores[0].id}
                    onChange={handleMetastoreChange}
                    transparent
                >
                    {queryMetastores.map((metastore) => (
                        <option key={metastore.id} value={metastore.id}>
                            {metastore.name}
                        </option>
                    ))}
                </Select>
            </div>
        ) : null;

    const orderByButtonFormatter = React.useCallback(
        () => (
            <span>
                {searchOrder === SearchOrder.Recency
                    ? 'Most recent'
                    : 'Most relevant'}
                <i className="fa fa-caret-down caret-icon ml8" />
            </span>
        ),
        [searchOrder]
    );

    const orderByDOM = (
        <Dropdown customButtonRenderer={orderByButtonFormatter} isRight>
            <ListMenu
                items={[SearchOrder.Recency, SearchOrder.Relevance].map(
                    (choice) => ({
                        name:
                            choice === 'Recency'
                                ? 'Most recent'
                                : 'Most relevant',
                        onClick:
                            searchOrder === choice
                                ? null
                                : updateSearchOrder.bind(null, choice),
                        checked: searchOrder === choice,
                    })
                )}
                type="select"
                isRight
            />
        </Dropdown>
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
            <SearchDatePicker
                name="start"
                id="start-date"
                value={searchFilters?.startDate}
                onChange={onStartDateChange}
            />
            <SearchDatePicker
                name="end"
                id="end-date"
                value={searchFilters?.endDate}
                onChange={onEndDateChange}
            />
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
                    selectProps={{
                        autoFocus: true,
                        styles: userReactSelectStyle,
                    }}
                    clearAfterSelect
                />
            </div>
        ) : (
            <Button
                onClick={toggleShowAddSearchAuthor}
                className="add-authors"
                icon="plus"
                title="more authors"
                theme="text"
                color="light"
                size="small"
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
                        <hr className="dh-hr" />
                    </span>
                    {getAuthorFiltersDOM()}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Date
                        <hr className="dh-hr" />
                    </span>
                    {dateFilterDOM}
                </div>
            </>
        ) : (
            <>
                <div className="search-filter">
                    <span className="filter-title">
                        Metastore
                        <hr className="dh-hr" />
                    </span>
                    {metastoreSelectDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Featured
                        <hr className="dh-hr" />
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
                        <hr className="dh-hr" />
                    </span>
                    {dateFilterDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Tags
                        <hr className="dh-hr" />
                    </span>
                    {tagDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Search Settings
                        <hr className="dh-hr" />
                    </span>
                    {searchSettingsDOM}
                </div>
            </>
        );

    const instructionsTipDOM = (
        <Level className="search-instructions-tip">
            <div className="search-instructions">
                <span className="search-instructions-span">
                    <KeyboardKey value="esc" />
                    <span className="ml4">to dismiss</span>
                </span>
            </div>
            <div className="search-tip">
                <KeyboardKey value="⌘" />
                <span className="pr4">+</span>
                <KeyboardKey value="K" className="mr4" />
                <span className="ml4">to open this faster</span>
            </div>
        </Level>
    );

    const searchBodyDOM = (
        <Container className="search-body" flex={'row'}>
            <div className="search-results">
                <div className="search-result-top horizontal-space-between">
                    <span className="search-result-count">
                        <PrettyNumber val={numberOfResult} />{' '}
                        {numberOfResult <= 1 ? 'result' : 'results'}
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
