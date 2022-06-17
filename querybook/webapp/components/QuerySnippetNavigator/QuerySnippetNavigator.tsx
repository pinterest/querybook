import { decorate } from 'core-decorators';
import { trim } from 'lodash';
import { bind, debounce } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';

import { QuerySnippetComposer } from 'components/QuerySnippetComposer/QuerySnippetComposer';
import { titleize } from 'lib/utils';
import { queryEngineSelector } from 'redux/queryEngine/selector';
import * as querySnippetsActions from 'redux/querySnippets/action';
import {
    IQuerySnippet,
    IQuerySnippetSearchFilter,
} from 'redux/querySnippets/types';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';
import { InfinityScroll } from 'ui/InfinityScroll/InfinityScroll';
import { ListLink } from 'ui/Link/ListLink';
import { Loading } from 'ui/Loading/Loading';
import { Modal } from 'ui/Modal/Modal';
import { Popover } from 'ui/Popover/Popover';
import { SearchBar } from 'ui/SearchBar/SearchBar';
import { Tabs } from 'ui/Tabs/Tabs';

import { QuerySnippetFilterPicker } from './QuerySnippetFilterPicker';

import './QuerySnippetNavigator.scss';

const NAVIGATOR_TABS = [
    {
        name: 'Golden',
        key: 'golden',
    },
    {
        name: 'Public',
        key: 'public',
    },
    {
        name: 'Private',
        key: 'private',
    },
];

interface IOwnProps {
    onQuerySnippetSelect: (item: IQuerySnippet) => any;
}
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;

export type IProps = IOwnProps & StateProps & DispatchProps;

interface IState {
    titleFilter: string;
    filters: Record<string, any>;

    searching: boolean;
    selectedTabKey: string;
    showFilterMenu: boolean;
    showCreateSnippetModal: boolean;
}

class QuerySnippetNavigatorComponent extends React.PureComponent<
    IProps,
    IState
> {
    public readonly state = {
        titleFilter: '',
        filters: {},

        searching: false,
        selectedTabKey: NAVIGATOR_TABS[0].key,
        showFilterMenu: false,
        showCreateSnippetModal: false,
    };

    private filterButton = React.createRef<HTMLAnchorElement>();

    @bind
    public getInitialSearchFilters() {
        return {};
    }

    @bind
    public searchQuerySnippets() {
        const { filters, selectedTabKey } = this.state;

        const searchFilters: IQuerySnippetSearchFilter = {};
        if (filters['engine_id'] != null) {
            searchFilters.engine_id = filters['engine_id'];
        }

        if (selectedTabKey === 'golden') {
            searchFilters.golden = true;
            searchFilters.is_public = true;
        } else if (selectedTabKey === 'public') {
            searchFilters.golden = false;
            searchFilters.is_public = true;
        } else {
            searchFilters.is_public = false;
        }

        this.setState(
            {
                searching: true,
            },
            async () => {
                await this.props.searchQuerySnippets(searchFilters);
                this.setState({
                    searching: false,
                });
            }
        );
    }

    @bind
    @decorate(memoizeOne)
    public getQuerySnippets(
        querySnippetById: Record<number, IQuerySnippet>,
        querySnippetIds: number[],
        titleFilter: string
    ) {
        const isEmptyFilter = trim(titleFilter).length === 0;
        const titleFilterLower = titleFilter.toLowerCase();

        return querySnippetIds
            .map((id) => querySnippetById[id])
            .filter(
                (querySnippet) =>
                    isEmptyFilter ||
                    querySnippet.title.toLowerCase().includes(titleFilterLower)
            );
    }

    @bind
    public onTabSelect(selectedTabKey) {
        this.setState({ selectedTabKey }, this.searchQuerySnippets);
    }

    @bind
    public snippetRowRenderer(snippet: IQuerySnippet) {
        return (
            <ListLink
                onClick={() => this.props.onQuerySnippetSelect(snippet)}
                isRow
                title={snippet.title}
            />
        );
    }

    @bind
    public makeQuerySnippetsListDOM() {
        const { querySnippetById, querySnippetIds } = this.props;

        const { searching, titleFilter, selectedTabKey } = this.state;

        if (searching) {
            return <Loading />;
        }

        const snippets = this.getQuerySnippets(
            querySnippetById,
            querySnippetIds,
            titleFilter
        );

        const snippetsDOM = snippets.length ? (
            <InfinityScroll<IQuerySnippet>
                elements={snippets}
                labelField={'title'}
                itemHeight={28}
                itemRenderer={this.snippetRowRenderer}
            />
        ) : (
            <div className="empty-section-message">
                No {titleize(selectedTabKey)} Snippets
            </div>
        );

        return <div className="snippets-wrapper">{snippetsDOM}</div>;
    }

    @bind
    @debounce(500)
    public onTitleFilter(titleFilter: string) {
        this.setState({
            titleFilter,
        });
    }

    @bind
    public updateSearchFilter(filterKey: string, filterVal: any) {
        this.setState(
            {
                filters: {
                    ...this.state.filters,
                    [filterKey]: filterVal,
                },
            },
            this.searchQuerySnippets
        );
    }

    @bind
    public toggleSnippetFilterPopover() {
        this.setState({
            showFilterMenu: !this.state.showFilterMenu,
        });
    }

    @bind
    public showCreateSnippetModal() {
        this.setState({
            showCreateSnippetModal: true,
        });
    }

    @bind
    public hideCreateSnippetModal() {
        this.setState({
            showCreateSnippetModal: false,
        });
    }

    public componentDidMount() {
        this.setState(
            {
                filters: this.getInitialSearchFilters(),
            },
            this.searchQuerySnippets
        );
    }

    public makeSearchFilterDOM() {
        const { titleFilter } = this.state;

        return (
            <div className="snippet-search flex-row list-header">
                <SearchBar
                    value={titleFilter}
                    onSearch={this.onTitleFilter}
                    isSearching={false}
                    placeholder="Search by Title"
                    transparent
                />
                <IconButton
                    onClick={this.toggleSnippetFilterPopover}
                    icon="Sliders"
                    aria-label="Filter"
                    data-balloon-pos="down"
                    ref={this.filterButton}
                />
                <IconButton
                    icon="Plus"
                    onClick={this.showCreateSnippetModal}
                    aria-label="New"
                    data-balloon-pos="down"
                />
            </div>
        );
    }

    public render() {
        const { queryEngines } = this.props;
        const { filters, showFilterMenu, showCreateSnippetModal } = this.state;

        const tabsDOM = (
            <Tabs
                items={NAVIGATOR_TABS}
                selectedTabKey={this.state.selectedTabKey}
                onSelect={this.onTabSelect}
                wide
                className="list-header"
            />
        );

        const filterDOM = showFilterMenu ? (
            <Popover
                anchor={this.filterButton.current}
                onHide={this.toggleSnippetFilterPopover}
                layout={['bottom']}
            >
                <QuerySnippetFilterPicker
                    filters={filters}
                    updateFilter={this.updateSearchFilter}
                    queryEngines={queryEngines}
                />
            </Popover>
        ) : null;

        const createModal = showCreateSnippetModal ? (
            <Modal onHide={this.hideCreateSnippetModal} title="Create Snippet">
                <QuerySnippetComposer onSave={this.hideCreateSnippetModal} />
            </Modal>
        ) : null;

        return (
            <>
                <div className="QuerySnippetNavigator SidebarNavigator">
                    {this.makeSearchFilterDOM()}
                    {tabsDOM}
                    <div className="list-content">
                        {this.makeQuerySnippetsListDOM()}
                    </div>
                </div>
                {filterDOM}
                {createModal}
            </>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    return {
        querySnippetById: state.querySnippets.querySnippetById,
        querySnippetIds: state.querySnippets.querySnippetIds,
        queryEngines: queryEngineSelector(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        searchQuerySnippets: bindActionCreators(
            querySnippetsActions.searchQuerySnippets,
            dispatch
        ),
    };
}

export const QuerySnippetNavigator = connect(
    mapStateToProps,
    mapDispatchToProps
)(QuerySnippetNavigatorComponent);
