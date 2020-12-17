import React, { useRef, useMemo, useCallback } from 'react';
import { ITableSearchFilters } from 'redux/dataTableSearch/types';

import { useToggleState } from 'hooks/useToggleState';

import { Popover } from 'ui/Popover/Popover';
import { ToggleSwitch } from 'ui/ToggleSwitch/ToggleSwitch';
import { Title } from 'ui/Title/Title';
import { IconButton } from 'ui/Button/IconButton';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { TableTagGroupSelect } from 'components/DataTableTags/TableTagGroupSelect';

import './DataTableNavigatorSearch.scss';
import { Button } from 'ui/Button/Button';

export const DataTableNavigatorSearch: React.FC<{
    searchString: string;
    onSearch: (s: string) => void;
    searchFilters: ITableSearchFilters;
    updateSearchFilter: <K extends keyof ITableSearchFilters>(
        filterKey: K,
        filterVal: ITableSearchFilters[K]
    ) => void;
    resetSearchFilter: () => void;
}> = ({
    searchString,
    onSearch,
    searchFilters,
    updateSearchFilter,
    resetSearchFilter,
}) => {
    const [showSearchFilter, , toggleSearchFilter] = useToggleState(false);
    const filterButtonRef = useRef<HTMLAnchorElement>();
    const searchFiltersSize = useMemo(() => Object.keys(searchFilters).length, [
        searchFilters,
    ]);

    const updateTags = useCallback(
        (newTags: string[]) => {
            updateSearchFilter('tags', newTags.length ? newTags : null);
        },
        [updateSearchFilter]
    );

    const searchFiltersPickerDOM = showSearchFilter && (
        <Popover
            onHide={toggleSearchFilter}
            anchor={filterButtonRef.current}
            layout={['right', 'top']}
        >
            <div className="DataTableNavigatorSearchFilter">
                <Button
                    title="Reset"
                    className="filter-reset-button"
                    type="soft"
                    small
                    borderless
                    onClick={resetSearchFilter}
                />
                <div>
                    <SearchFilterRow
                        title="Featured"
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
                placeholder="Search by Table Name..."
                transparent
                delayMethod="throttle"
            />
            <IconButton
                ref={filterButtonRef}
                className=""
                size={'18px'}
                noPadding
                onClick={toggleSearchFilter}
                icon="sliders"
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
        <Title className="mr8" size={7}>
            {title}
        </Title>
        <div className="search-filter-row-item">{children}</div>
    </div>
);
