import { isEmpty } from 'lodash';
import moment from 'moment';
import React, { useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import CreatableSelect from 'react-select/creatable';

import { UserAvatar } from 'components/UserBadge/UserAvatar';
import { UserSelect } from 'components/UserSelect/UserSelect';
import PublicConfig from 'config/querybook_public_config.yaml';
import { ComponentType, ElementType } from 'const/analytics';
import {
    IBoardPreview,
    IDataDocPreview,
    IQueryPreview,
    ITablePreview,
} from 'const/search';
import { SurveySurfaceType } from 'const/survey';
import { useShallowSelector } from 'hooks/redux/useShallowSelector';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';
import { useTrackView } from 'hooks/useTrackView';
import { trackClick, trackView } from 'lib/analytics';
import { titleize } from 'lib/utils';
import { getCurrentEnv } from 'lib/utils/query-string';
import {
    defaultReactSelectStyles,
    makeReactSelectStyle,
    miniAsyncReactSelectStyles,
} from 'lib/utils/react-select';
import { queryMetastoresSelector } from 'redux/dataSources/selector';
import * as dataTableSearchActions from 'redux/dataTableSearch/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import * as searchActions from 'redux/search/action';
import { RESULT_PER_PAGE, SearchOrder, SearchType } from 'redux/search/types';
import { IStoreState } from 'redux/store/types';
import { DataElementResource, TableTagResource } from 'resource/table';
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
import { PrettyNumber } from 'ui/PrettyNumber/PrettyNumber';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Select } from 'ui/Select/Select';
import { SimpleReactSelect } from 'ui/SimpleReactSelect/SimpleReactSelect';
import { AccentText, EmptyText } from 'ui/StyledText/StyledText';
import { Tabs } from 'ui/Tabs/Tabs';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import { EntitySelect } from './EntitySelect';
import { SearchDatePicker } from './SearchDatePicker';
import {
    BoardItem,
    DataDocItem,
    DataTableItem,
    QueryItem,
} from './SearchResultItem';
import { SearchSchemaSelect } from './SearchSchemaSelect';
import { TableSelect } from './TableSelect';

import './SearchOverview.scss';

const AIAssistantConfig = PublicConfig.ai_assistant;

const userReactSelectStyle = makeReactSelectStyle(
    true,
    miniAsyncReactSelectStyles
);

interface ISearchOverviewProps {
    fromBoardId?: number;
}

const SearchTypeToElementType = {
    [SearchType.Query]: ElementType.QUERY_RESULT_ITEM,
    [SearchType.DataDoc]: ElementType.DATADOC_RESULT_ITEM,
    [SearchType.Table]: ElementType.TABLE_RESULT_ITEM,
    [SearchType.Board]: ElementType.LIST_RESULT_ITEM,
};

export const SearchOverview: React.FC<ISearchOverviewProps> = ({
    fromBoardId,
}) => {
    useTrackView(ComponentType.SEARCH_MODAL);

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
        useVectorSearch,

        searchRequest,
        queryMetastores,
        queryEngines,
        metastoreId: _metastoreId,
    } = useShallowSelector((state: IStoreState) => ({
        ...state.search,
        environment: currentEnvironmentSelector(state),
        queryEngines: queryEngineSelector(state),
        queryEngineById: queryEngineByIdEnvSelector(state),
        queryMetastores: queryMetastoresSelector(state),
        metastoreId: state.dataTableSearch.metastoreId,
    }));
    const metastoreId = _metastoreId ?? queryMetastores?.[0]?.id;

    const results = useMemo(
        () => resultByPage[currentPage] || [],
        [resultByPage, currentPage]
    );
    const isLoading = !!searchRequest;

    const triggerSurvey = useSurveyTrigger();
    useEffect(() => {
        if (
            !isLoading &&
            searchString.length > 0 &&
            searchType === SearchType.Table
        ) {
            triggerSurvey(SurveySurfaceType.TABLE_SEARCH, {
                search_query: searchString,
                search_filter: Object.keys(searchFilters),
                is_modal: true,
            });
        }
    }, [searchString, searchType, isLoading, searchFilters, triggerSurvey]);

    // Log search results
    useEffect(() => {
        if (!isLoading && searchString.length > 0 && results.length > 0) {
            const elementType = SearchTypeToElementType[searchType];
            trackView(ComponentType.SEARCH_MODAL, elementType, {
                search: searchString,
                results: results.map((r) => r.id),
                page: currentPage,
            });
        }
    }, [isLoading, searchString, results, searchType, currentPage]);

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
    const updateUseVectorSearch = React.useCallback((useVectorSearch) => {
        dispatch(searchActions.updateUseVectorSearch(useVectorSearch));
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

    const searchTabs = useMemo(() => {
        const searchTabs = [
            {
                name: 'Query',
                key: SearchType.Query,
                elementType: ElementType.QUERY_SEARCH_TAB,
            },
            {
                name: 'DataDoc',
                key: SearchType.DataDoc,
                elementType: ElementType.DATADOC_SEARCH_TAB,
            },
        ];

        if (queryMetastores.length) {
            searchTabs.push({
                name: 'Tables',
                key: SearchType.Table,
                elementType: ElementType.TABLE_SEARCH_TAB,
            });
        }

        searchTabs.push({
            name: 'List',
            key: SearchType.Board,
            elementType: ElementType.LIST_SEARCH_TAB,
        });

        return searchTabs;
    }, [queryMetastores.length]);

    const [showAddSearchAuthor, setShowAddSearchAuthor] = React.useState(false);

    const onSearchTabSelect = React.useCallback(
        (newSearchType: string) => {
            const elementType = searchTabs.find(
                (t) => t.key === newSearchType
            ).elementType;
            trackClick({
                component: ComponentType.SEARCH_MODAL,
                element: elementType,
            });
            updateSearchType(newSearchType);
        },
        [updateSearchType]
    );

    const toggleShowAddSearchAuthor = React.useCallback(() => {
        setShowAddSearchAuthor((v) => !v);
    }, [setShowAddSearchAuthor]);

    const handleMetastoreChange = React.useCallback(
        (evt: React.ChangeEvent<HTMLSelectElement>) => {
            selectMetastore(Number(evt.target.value));
        },
        [selectMetastore]
    );

    const onStartDateChange = React.useCallback(
        (evt) => {
            const newDate = Number(moment(evt.target.value).format('X'));
            updateSearchFilter('startDate', isNaN(newDate) ? null : newDate);
        },
        [updateSearchFilter]
    );

    const onEndDateChange = React.useCallback(
        (evt) => {
            const newDate = Number(moment(evt.target.value).format('X'));

            updateSearchFilter('endDate', isNaN(newDate) ? null : newDate);
        },
        [updateSearchFilter]
    );

    const setMinDuration = React.useCallback(
        (value: number | null) => updateSearchFilter('minDuration', value),
        [updateSearchFilter]
    );

    const setMaxDuration = React.useCallback(
        (value: number | null) => updateSearchFilter('maxDuration', value),
        [updateSearchFilter]
    );

    const onTrackClick = React.useCallback(
        (pos) => {
            const elementType = SearchTypeToElementType[searchType];
            trackClick({
                component: ComponentType.SEARCH_MODAL,
                element: elementType,
                aux: {
                    search: searchString,
                    results: results.map((r) => r.id),
                    page: currentPage,
                    pos,
                },
            });
        },
        [searchType, searchString, results, currentPage]
    );

    const getSearchBarDOM = () => {
        const placeholder =
            searchType === SearchType.Query
                ? 'Search queries'
                : searchType === SearchType.DataDoc
                ? 'Search data docs'
                : 'Search tables';

        return (
            <div className="search-bar-wrapper">
                <SearchBar
                    className="SearchBar"
                    value={searchString}
                    onSearch={handleUpdateSearchString}
                    isSearching={isLoading}
                    hasIcon={isLoading}
                    hasClearSearch={true}
                    placeholder={placeholder}
                    autoFocus
                />
                {searchType === SearchType.Table &&
                    AIAssistantConfig.enabled &&
                    AIAssistantConfig.table_vector_search.enabled && (
                        <div className="mt8 flex-row">
                            <AccentText weight="bold" className="ml8 mr12">
                                Natural Language Search
                            </AccentText>
                            <ToggleSwitch
                                checked={useVectorSearch}
                                onChange={(val) => updateUseVectorSearch(val)}
                            />
                        </div>
                    )}
            </div>
        );
    };

    React.useEffect(() => {
        mapQueryParamToState();
    }, []);

    const searchTypeDOM = (
        <div className="search-types mv4">
            <Tabs
                items={searchTabs}
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

    const updateDataElements = React.useCallback(
        (newDataElements: string[]) => {
            updateSearchFilter(
                'data_elements',
                newDataElements.length ? newDataElements : null
            );
        },
        [updateSearchFilter]
    );

    const tagDOM = (
        <EntitySelect
            selectedEntities={searchFilters?.tags || []}
            loadEntities={TableTagResource.search}
            onEntitiesChange={updateTags}
            placeholder="search tag"
        />
    );

    const queryMetastore =
        searchType === SearchType.Table &&
        queryMetastores.find((metastore) => metastore.id === metastoreId);
    const queryMetastoreHasDataElements =
        !!queryMetastore?.flags?.has_data_element;

    const metastoreSelectDOM =
        searchType === SearchType.Table ? (
            <div className="tables-search-select">
                <Select
                    value={metastoreId}
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
    const dataElementDOM = queryMetastoreHasDataElements && (
        <EntitySelect
            selectedEntities={searchFilters?.data_elements || []}
            loadEntities={DataElementResource.search}
            onEntitiesChange={updateDataElements}
            placeholder="search data element"
        />
    );

    const orderByButtonFormatter = React.useCallback(
        () => (
            <div className="flex-row">
                {searchOrder === SearchOrder.Recency
                    ? 'Most recent'
                    : 'Most relevant'}
                <Icon className="ml8" name="ChevronDown" size={16} />
            </div>
        ),
        [searchOrder]
    );

    const orderByDOM = (
        <Dropdown
            customButtonRenderer={orderByButtonFormatter}
            layout={['bottom', 'right']}
        >
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
            />
        </Dropdown>
    );

    const environment = getCurrentEnv();
    const resultsDOM =
        searchType === SearchType.Query
            ? (results as IQueryPreview[]).map((result, index) => (
                  <QueryItem
                      searchString={searchString}
                      key={`${result.query_type}-${result.id}`}
                      preview={result}
                      environmentName={environment.name}
                      fromBoardId={fromBoardId}
                      onTrackClick={() => onTrackClick(index)}
                  />
              ))
            : searchType === SearchType.DataDoc
            ? (results as IDataDocPreview[]).map((result, index) => (
                  <DataDocItem
                      searchString={searchString}
                      key={result.id}
                      preview={result}
                      url={`/${environment.name}/datadoc/${result.id}/`}
                      fromBoardId={fromBoardId}
                      onTrackClick={() => onTrackClick(index)}
                  />
              ))
            : searchType === SearchType.Table
            ? (results as ITablePreview[]).map((result, index) => (
                  <DataTableItem
                      key={result.id}
                      preview={result}
                      url={`/${environment.name}/table/${result.id}/`}
                      searchString={searchString}
                      fromBoardId={fromBoardId}
                      currentPage={currentPage}
                      index={index}
                      onTrackClick={() => onTrackClick(index)}
                  />
              ))
            : (results as IBoardPreview[]).map((result, index) => (
                  <BoardItem
                      key={result.id}
                      preview={result}
                      url={`/${environment.name}/list/${result.id}/`}
                      searchString={searchString}
                      fromBoardId={fromBoardId}
                      onTrackClick={() => onTrackClick(index)}
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
            <div className="add-authors mt4">
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
                icon="Plus"
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
                    <span className="filter-title">Authors</span>
                    {getAuthorFiltersDOM('author_uid')}
                </div>
                <div className="search-filter">
                    <span className="filter-title">Query Engine</span>
                    {queryEngineFilterDOM}
                </div>
                {queryMetastores.length > 0 && (
                    <div className="search-filter">
                        <span className="filter-title">Tables</span>
                        {tableFilterDOM}
                    </div>
                )}
                <div className="search-filter">
                    <span className="filter-title">Query Type</span>
                    {queryTypeFilterDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">Statement Type</span>
                    <div className="result-item-golden horizontal-space-between">
                        {statementTypeFilterDOM}
                    </div>
                </div>
                <div className="search-filter">
                    <span className="filter-title">Created At</span>
                    {dateFilterDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">Duration</span>
                    {durationFilterDOM}
                </div>
            </>
        ) : searchType === 'DataDoc' ? (
            <>
                <div className="search-filter">
                    <span className="filter-title">Authors</span>
                    {getAuthorFiltersDOM('owner_uid')}
                </div>
                <div className="search-filter">
                    <span className="filter-title">Created At</span>
                    {dateFilterDOM}
                </div>
            </>
        ) : searchType === 'Table' ? (
            <>
                {queryMetastores.length > 1 && (
                    <div className="search-filter">
                        <span className="filter-title">Metastore</span>
                        {metastoreSelectDOM}
                    </div>
                )}
                <div className="search-filter">
                    <span className="filter-title">Top Tier</span>
                    <div className="result-item-golden horizontal-space-between">
                        <span>
                            <span>top tier only</span>
                            <Icon className="crown ml4" name="Crown" />
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
                    <span
                        className="filter-title"
                        aria-label="Table belongs to ONE OF selected schemas"
                        data-balloon-pos="up"
                    >
                        Schemas
                    </span>
                    <SearchSchemaSelect
                        updateSearchFilter={updateSearchFilter}
                        schema={searchFilters?.schema}
                    />
                </div>
                {queryMetastoreHasDataElements && (
                    <div className="search-filter">
                        <span
                            className="filter-title"
                            aria-label="Table associates with ALL selected data elements"
                            data-balloon-pos="up"
                        >
                            Data Elements
                        </span>
                        {dataElementDOM}
                    </div>
                )}

                <div className="search-filter">
                    <span
                        className="filter-title"
                        aria-label="Table contains ALL selected tags"
                        data-balloon-pos="up"
                    >
                        Tags
                    </span>
                    {tagDOM}
                </div>

                <div className="search-filter">
                    <span className="filter-title">Search Settings</span>
                    {searchSettingsDOM}
                </div>
                <div className="search-filter">
                    <span className="filter-title">Created At</span>
                    {dateFilterDOM}
                </div>
            </>
        ) : (
            <>
                <div className="search-filter">
                    <span className="filter-title">Authors</span>
                    {getAuthorFiltersDOM('owner_uid')}
                </div>

                {queryMetastores.length && (
                    <div className="search-filter">
                        <span className="filter-title">Tables</span>
                        {tableFilterDOM}
                    </div>
                )}
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
        <EmptyText>Enter a search string or apply filters to begin.</EmptyText>
    );

    const searchBodyDOM = (
        <Container className="search-body" flex={'row'}>
            <div className="search-results">
                <div className="search-result-top horizontal-space-between">
                    {hasBegunSearch ? (
                        <>
                            <span className="search-result-count">
                                <PrettyNumber
                                    val={numberOfResult}
                                    unit="result"
                                />
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
            <div className="search-filters">{FilterDOM}</div>
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
