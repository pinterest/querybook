import { startCase } from 'lodash';
import React, { useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { TableTagGroupSelect } from 'components/DataTableTags/TableTagGroupSelect';
import { useToggleState } from 'hooks/useToggleState';
import { changeSchemasSort } from 'redux/dataTableSearch/action';
import { ITableSearchFilters } from 'redux/dataTableSearch/types';
import { IStoreState } from 'redux/store/types';
import { SoftButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { OrderByButton } from 'ui/OrderByButton/OrderByButton';
import { Popover } from 'ui/Popover/Popover';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Title } from 'ui/Title/Title';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';

import './DataTableNavigatorSearch.scss';

export const DataTableNavigatorSearch: React.FC<{
    metastoreId: number;
    searchString: string;
    onSearch: (s: string) => void;
    searchFilters: ITableSearchFilters;
    updateSearchFilter: <K extends keyof ITableSearchFilters>(
        filterKey: K,
        filterVal: ITableSearchFilters[K]
    ) => void;
    resetSearchFilter: () => void;

    showTableSearchResult: boolean;
}> = ({
    searchString,
    onSearch,
    searchFilters,
    updateSearchFilter,
    resetSearchFilter,

    showTableSearchResult,
}) => {
    const [showSearchFilter, , toggleSearchFilter] = useToggleState(false);
    const filterButtonRef = useRef<HTMLAnchorElement>();
    const searchFiltersSize = useMemo(
        () => Object.keys(searchFilters).length,
        [searchFilters]
    );
    const { key: sortSchemaKey, asc: sortSchemaAsc } = useSelector(
        (state: IStoreState) => state.dataTableSearch.schemas.sortSchemasBy
    );

    const updateTags = useCallback(
        (newTags: string[]) => {
            updateSearchFilter('tags', newTags.length ? newTags : null);
        },
        [updateSearchFilter]
    );

    const dispatch = useDispatch();

    const searchFiltersPickerDOM = showSearchFilter && (
        <Popover
            onHide={toggleSearchFilter}
            anchor={filterButtonRef.current}
            layout={['right', 'top']}
        >
            <div className="DataTableNavigatorSearchFilter">
                <SoftButton
                    title="Reset"
                    className="filter-reset-button"
                    size="small"
                    onClick={resetSearchFilter}
                />
                <div>
                    <SearchFilterRow
                        title="Top Tier"
                        className="toggle-padding"
                    >
                        <ToggleSwitch
                            checked={searchFilters.golden}
                            onChange={(checked) =>
                                updateSearchFilter(
                                    'golden',
                                    checked ? true : null
                                )
                            }
                        />
                    </SearchFilterRow>
                    <SearchFilterRow title="Schema">
                        <SearchBar
                            value={searchFilters?.schema ?? ''}
                            onSearch={(s: string) =>
                                updateSearchFilter(
                                    'schema',
                                    s.length ? s : null
                                )
                            }
                            placeholder="Full schema name"
                        />
                    </SearchFilterRow>
                    <SearchFilterRow title="Tags">
                        <TableTagGroupSelect
                            tags={searchFilters?.tags}
                            updateTags={updateTags}
                        />
                    </SearchFilterRow>
                </div>
            </div>
        </Popover>
    );

    return (
        <div className="DataTableNavigatorSearch flex-row">
            <SearchBar
                value={searchString}
                onSearch={onSearch}
                placeholder="Search by Name"
                transparent
            />

            {!showTableSearchResult && (
                <OrderByButton
                    className="mr4"
                    asc={sortSchemaAsc}
                    orderByField={startCase(sortSchemaKey)}
                    orderByFieldSymbol={sortSchemaKey === 'name' ? 'Aa' : 'Tc'}
                    onAscToggle={() => {
                        dispatch(changeSchemasSort(null, !sortSchemaAsc));
                    }}
                    onOrderByFieldToggle={() => {
                        dispatch(
                            changeSchemasSort(
                                sortSchemaKey === 'table_count'
                                    ? 'name'
                                    : 'table_count'
                            )
                        );
                    }}
                />
            )}

            <IconButton
                ref={filterButtonRef}
                size={'18px'}
                className="table-search-filter-button"
                noPadding
                onClick={toggleSearchFilter}
                icon="Sliders"
                active={searchFiltersSize > 0}
                ping={searchFiltersSize > 0 ? String(searchFiltersSize) : null}
            />
            {searchFiltersPickerDOM}
        </div>
    );
};

const SearchFilterRow: React.FC<{ title: string; className?: string }> = ({
    title,
    children,
    className,
}) => (
    <div className={`search-filter-row ${className ?? ''}`}>
        <Title className="mr8 search-filter-title" size="text">
            {title}
        </Title>
        <div className="search-filter-row-item">{children}</div>
    </div>
);
