import React, { useCallback, useMemo, useRef } from 'react';

import { IQueryEngine } from 'const/queryEngine';
import { QueryExecutionStatus } from 'const/queryExecution';
import { IOptions } from 'lib/utils/react-select';
import { getEnumEntries } from 'lib/typescript';
import { IQueryViewFilter } from 'redux/queryView/types';

import { UserName } from 'components/UserBadge/UserName';
import { Popover } from 'ui/Popover/Popover';
import { IconButton } from 'ui/Button/IconButton';
import { TagGroup, Tag } from 'ui/Tag/Tag';
import { useToggleState } from 'hooks/useToggleState';
import { QueryViewFilterPicker } from './QueryViewFilterPicker';
import { navigateWithinEnv } from 'lib/utils/query-string';

interface IQueryViewFilterProps {
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    filters: IQueryViewFilter;
    updateFilter: (key: string, value: string) => void;
    onRefresh: () => void;
}

const statusOptions: IOptions = getEnumEntries(QueryExecutionStatus).map(
    ([status, statusEnum]) => ({
        label: status,
        value: statusEnum,
    })
);

export const QueryViewFilter = React.memo<IQueryViewFilterProps>(
    ({ queryEngines, queryEngineById, filters, updateFilter, onRefresh }) => {
        const navigateToSearch = useCallback(() => {
            navigateWithinEnv(
                '/search/?searchFilters[query_type]=query_execution',
                { isModal: true }
            );
        }, []);
        const configButtonRef = useRef<HTMLAnchorElement>();
        const engineOptions: IOptions = useMemo(
            () =>
                queryEngines.map((queryEngine) => ({
                    label: queryEngine.name,
                    value: queryEngine.id,
                })),
            [queryEngines]
        );

        const [showFilterPicker, _, toggleFilterPicker] = useToggleState(false);

        const filterTagsDOM = Object.entries(filters)
            // Skip showing user filter since its not mutable
            .filter(
                ([filterKey, filterVal]) => filterVal && filterKey !== 'user'
            )
            .map(([filterKey, filterVal]) => {
                let filterValDOM: React.ReactNode;
                switch (filterKey) {
                    case 'user':
                        filterValDOM = <UserName uid={filterVal} />;
                        break;
                    case 'engine':
                        filterValDOM = queryEngineById[filterVal].name;
                        break;
                    default:
                        filterValDOM = filterVal || 'any';
                }

                return (
                    <TagGroup className="QueryViewFilter-tag" key={filterKey}>
                        <Tag>{filterKey}</Tag>
                        <Tag highlighted>{filterValDOM}</Tag>
                    </TagGroup>
                );
            });
        const filterTagSectionDOM = (
            <div className="QueryViewFilter-tags">{filterTagsDOM}</div>
        );

        const filterPickerDOM = showFilterPicker && (
            <Popover
                onHide={toggleFilterPicker}
                anchor={configButtonRef.current}
                layout={['right', 'top']}
            >
                <QueryViewFilterPicker
                    filters={filters}
                    updateFilter={updateFilter}
                    engineOptions={engineOptions}
                    statusOptions={statusOptions}
                />
            </Popover>
        );

        const searchButton = (
            <IconButton icon="Search" onClick={navigateToSearch} />
        );

        const configButton = (
            <IconButton
                icon="Sliders"
                ref={configButtonRef}
                onClick={toggleFilterPicker}
            />
        );
        const refreshButton = (
            <IconButton icon="RefreshCw" onClick={onRefresh} />
        );

        const configSection = (
            <div className="QueryViewFilter-icons">
                {searchButton}
                {configButton}
                {refreshButton}
            </div>
        );

        return (
            <div className="QueryViewFilter">
                {filterTagSectionDOM}
                {configSection}
                {filterPickerDOM}
            </div>
        );
    }
);
