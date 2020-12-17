import React from 'react';
import { bind } from 'lodash-decorators';

import { IQueryEngine } from 'const/queryEngine';
import { QueryExecutionStatus } from 'const/queryExecution';
import { IOptions } from 'lib/utils/react-select';
import { getEnumEntries } from 'lib/typescript';
import { IQueryViewFilter } from 'redux/queryView/types';

import { UserName } from 'components/UserBadge/UserName';
import { Popover } from 'ui/Popover/Popover';
import { IconButton } from 'ui/Button/IconButton';
import { TagGroup, Tag } from 'ui/Tag/Tag';
import { QueryViewFilterPicker } from './QueryViewFilterPicker';

interface IQueryViewFilterProps {
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    filters: IQueryViewFilter;
    updateFilter: (key: string, value: string) => any;
    onRefresh: () => any;
}

interface IQueryViewFilterState {
    showFilterPicker: boolean;
}

export class QueryViewFilter extends React.PureComponent<
    IQueryViewFilterProps,
    IQueryViewFilterState
> {
    private configButtonRef = React.createRef<HTMLAnchorElement>();
    private engineOptions: IOptions;
    private statusOptions: IOptions;

    public constructor(props: IQueryViewFilterProps) {
        super(props);
        this.engineOptions = props.queryEngines.map((queryEngine) => ({
            label: queryEngine.name,
            value: queryEngine.id,
        }));

        this.statusOptions = getEnumEntries(QueryExecutionStatus).map(
            ([status, statusEnum]) => ({
                label: status,
                value: statusEnum,
            })
        );

        this.state = {
            showFilterPicker: false,
        };
    }

    @bind
    public toggleFilterPicker() {
        this.setState((state) => ({
            showFilterPicker: !state.showFilterPicker,
        }));
    }

    public render() {
        const {
            filters,
            onRefresh,
            updateFilter,
            queryEngineById,
        } = this.props;
        const { showFilterPicker } = this.state;

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
                onHide={this.toggleFilterPicker}
                anchor={this.configButtonRef.current}
                layout={['right', 'top']}
            >
                <QueryViewFilterPicker
                    filters={filters}
                    updateFilter={updateFilter}
                    engineOptions={this.engineOptions}
                    statusOptions={this.statusOptions}
                />
            </Popover>
        );

        const configButton = (
            <IconButton
                icon="sliders"
                ref={this.configButtonRef}
                onClick={this.toggleFilterPicker}
            />
        );
        const refreshButton = (
            <IconButton icon="refresh-cw" onClick={onRefresh} />
        );

        const configSection = (
            <div className="QueryViewFilter-icons">
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
}
