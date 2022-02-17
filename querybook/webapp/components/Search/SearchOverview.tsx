import React from 'react';
import moment from 'moment';
import { useDispatch } from 'react-redux';
import CreatableSelect from 'react-select/creatable';
import { isEmpty } from 'lodash';

import { IDataDocPreview, IQueryPreview, ITablePreview } from 'const/search';

import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { getCurrentEnv } from 'lib/utils/query-string';
import {
    defaultReactSelectStyles,
    makeReactSelectStyle,
    miniReactSelectStyles,
} from 'lib/utils/react-select';
import { titleize } from 'lib/utils';
import * as searchActions from 'redux/search/action';
import { IStoreState } from 'redux/store/types';
import { RESULT_PER_PAGE, SearchOrder, SearchType } from 'redux/search/types';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';

import { UserSelect } from 'components/UserSelect/UserSelect';
import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { TableTagGroupSelect } from 'components/DataTableTags/TableTagGroupSelect';
import { DataDocItem, DataTableItem, QueryItem } from './SearchResultItem';

import { Button } from 'ui/Button/Button';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Container } from 'ui/Container/Container';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { KeyboardKey } from 'ui/KeyboardKey/KeyboardKey';
import { Level } from 'ui/Level/Level';
import { ListMenu } from 'ui/Menu/ListMenu';
import NumberInput from 'ui/NumberInput/NumberInput';
import { Pagination } from 'ui/Pagination/Pagination';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Select } from 'ui/Select/Select';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { Tabs } from 'ui/Tabs/Tabs';
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { SearchDatePicker } from './SearchDatePicker';
import { TableSelect } from './TableSelect';
import './SearchOverview.scss';

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
        queryEngines,
        queryEngineById,
        metastoreId,
    } = useShallowSelector((state: IStoreState) => ({
        ...state.search,
        environment: currentEnvironmentSelector(state),
        queryEngines: queryEngineSelector(state),
        queryEngineById: queryEngineByIdEnvSelector(state),
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
                  name: 'Query',
                  key: SearchType.Query,
              },
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
                  name: 'Query',
                  key: SearchType.Query,
              },
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

    const setMinDuration = React.useCallback(
        (value: number | null) => updateSearchFilter('minDuration', value),
        []
    );

    const setMaxDuration = React.useCallback(
        (value: number | null) => updateSearchFilter('maxDuration', value),
        []
    );

    const getSearchBarDOM = () => {
        const placeholder =
            searchType === SearchType.Query
                ? 'Search queries'
                : searchType === SearchType.DataDoc
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
        searchType === SearchType.Query
            ? (results as IQueryPreview[]).map((result) => (
                  <QueryItem
                      searchString={searchString}
                      key={`${result.query_type}-${result.id}`}
                      preview={result}
                      environmentName={environment.name}
                  />
              ))
            : searchType === SearchType.DataDoc
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

    const durationFilterDOM = (
        <div className="filter-duration">
            <div className="horizontal-space-between mb12">
                <span>min</span>
                <NumberInput
                    id="min-duration"
                    placeholder="seconds"
                    value={searchFilters['minDuration'] ?? ''}
                    onChange={setMinDuration}
                    min="0"
                />
            </div>
            <div className="horizontal-space-between mb12">
                <span>max</span>
                <NumberInput
                    id="max-duration"
                    placeholder="seconds"
                    value={searchFilters['maxDuration'] ?? ''}
                    onChange={setMaxDuration}
                    min="0"
                />
            </div>
        </div>
    );

    const queryEngineFilterDOM = (
        <SimpleReactSelect
            value={searchFilters['engine_id']}
            onChange={(value) => {
                updateSearchFilter('engine_id', value);
            }}
            options={queryEngines.map((engine) => ({
                label: engine.name,
                value: engine.id,
            }))}
            withDeselect
        />
    );

    const queryTypeFilterDOM = (
        <div className="filter-query-type">
            <SimpleReactSelect
                value={searchFilters['query_type']}
                onChange={(value) => updateSearchFilter('query_type', value)}
                options={['query_cell', 'query_execution'].map((queryType) => ({
                    label: titleize(queryType, '_', ' '),
                    value: queryType,
                }))}
                withDeselect
            />
        </div>
    );

    const statementTypeFilterDOM = (
        <div className="filter-statement-type">
            <CreatableSelect
                styles={defaultReactSelectStyles}
                value={
                    searchFilters['statement_type']
                        ? searchFilters['statement_type'].map((statement) => ({
                              label: statement.toUpperCase(),
                              value: statement,
                          }))
                        : null
                }
                onChange={(values) => {
                    const statementTypes =
                        values && values.length
                            ? values.map(({ value }) => value)
                            : null;
                    updateSearchFilter('statement_type', statementTypes);
                }}
                options={['ALTER', 'CREATE', 'DROP', 'INSERT', 'SELECT'].map(
                    (statement) => ({
                        label: statement,
                        value: statement,
                    })
                )}
                isMulti
                isClearable
            />
        </div>
    );

    const tableFilterDOM = (
        <TableSelect
            tableNames={searchFilters['full_table_name'] || []}
            onTableNamesChange={(tableNames: string[]) =>
                updateSearchFilter(
                    'full_table_name',
                    !isEmpty(tableNames) ? tableNames : null
                )
            }
            selectProps={{
                autoFocus: true,
            }}
            clearAfterSelect
        />
    );

    const getAuthorFiltersDOM = (searchFilterKey: string) => {
        const filterVal = searchFilters[searchFilterKey];

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
                            searchFilterKey,
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
                        updateSearchFilter(searchFilterKey, uid);
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
    };

    const FilterDOM =
        searchType === 'Query' ? (
            <>
                <div className="search-filter">
                    <span className="filter-title">
                        Authors
                        <hr className="dh-hr" />
                    </span>
                    {getAuthorFiltersDOM('author_uid')}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Query Engine
                        <hr className="dh-hr" />
                    </span>
                    {queryEngineFilterDOM}
                </div>
                {queryMetastores.length && (
                    <div className="search-filter">
                        <span className="filter-title">
                            Tables
                            <hr className="dh-hr" />
                        </span>
                        {tableFilterDOM}
                    </div>
                )}
                <div className="search-filter">
                    <span className="filter-title">
                        Query Type
                        <hr className="dh-hr" />
                    </span>
                    {queryTypeFilterDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Statement Type
                        <hr className="dh-hr" />
                    </span>
                    <div className="result-item-golden horizontal-space-between">
                        {statementTypeFilterDOM}
                    </div>
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Created At
                        <hr className="dh-hr" />
                    </span>
                    {dateFilterDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">
                        Duration
                        <hr className="dh-hr" />
                    </span>
                    {durationFilterDOM}
                </div>
            </>
        ) : searchType === 'DataDoc' ? (
            <>
                <div className="search-filter">
                    <span className="filter-title">
                        Authors
                        <hr className="dh-hr" />
                    </span>
                    {getAuthorFiltersDOM('owner_uid')}
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

    const hasBegunSearch =
        numberOfResult > 0 ||
        searchType !== SearchType.Query ||
        !isEmpty(searchFilters) ||
        !!searchString;
    const beginSearchPromptDOM = (
        <div className="begin-search-prompt">
            Please enter a search string or apply search filters to begin
            search.
        </div>
    );

    const searchBodyDOM = (
        <Container className="search-body" flex={'row'}>
            <div className="search-results">
                <div className="search-result-top horizontal-space-between">
                    {hasBegunSearch ? (
                        <>
                            <span className="search-result-count">
                                <PrettyNumber val={numberOfResult} />{' '}
                                {numberOfResult === 1 ? 'result' : 'results'}
                            </span>
                            <span>{orderByDOM}</span>
                        </>
                    ) : (
                        beginSearchPromptDOM
                    )}
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
