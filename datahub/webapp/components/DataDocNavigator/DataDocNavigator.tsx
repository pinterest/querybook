import * as classNames from 'classnames';
import { findIndex } from 'lodash';
import { decorate } from 'core-decorators';
import { bind } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import { connect } from 'react-redux';
import {
    withRouter,
    RouteComponentProps,
    Switch,
    Route,
} from 'react-router-dom';

import { sendConfirm } from 'lib/dataHubUI';
import { dataDocsOrderedSelector } from 'redux/dataDoc/selector';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import * as dataDocActions from 'redux/dataDoc/action';
import { IDataDoc } from 'const/datadoc';

import { IStoreState, Dispatch } from 'redux/store/types';

import { CreateDataDocButton } from 'components/CreateDataDocButton/CreateDataDocButton';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Tabs, ITabItem } from 'ui/Tabs/Tabs';
import { Loading } from 'ui/Loading/Loading';

import { DataDocGridItem } from './DataDocGridItem';

import './DataDocNavigator.scss';
import { SearchBar } from 'ui/SearchBar/SearchBar';

const navigatorTabs: ITabItem[] = [
    {
        name: 'Mine',
        key: 'mine',
    },
    {
        name: 'Favorite',
        key: 'favorite',
    },
    {
        name: 'Recent',
        key: 'recent',
    },
];

export interface IDataDocNavigatorOwnProps extends RouteComponentProps {
    // from own Props
    docId?: number;
}
type DataDocNavigatorStateProps = ReturnType<typeof mapStateToProps>;
type DataDocNavigatorDispatchProps = ReturnType<typeof mapDispatchToProps>;
type IDataDocNavigatorProps = IDataDocNavigatorOwnProps &
    DataDocNavigatorStateProps &
    DataDocNavigatorDispatchProps;

export interface IDataDocNavigatorState {
    titleFilterString: string;

    selectedTabKey: string;
}

class DataDocNavigatorComponent extends React.Component<
    IDataDocNavigatorProps,
    IDataDocNavigatorState
> {
    public readonly state = {
        titleFilterString: '',
        selectedTabKey: navigatorTabs[0].key,
    };

    public componentDidMount() {
        this.loadDataDocs();
    }
    public componentDidUpdate() {
        this.loadDataDocs();
    }

    public loadDataDocs() {
        this._loadDataDocs(
            this.props.environment.name,
            this.state.selectedTabKey
        );
    }

    @decorate(memoizeOne)
    public _loadDataDocs(envName: string, tabKey: string) {
        // Use envName and tabKey as cache breaker
        this.props.loadDataDocs(tabKey);
    }

    @bind
    public onTitleFilter(titleFilterString: string) {
        this.setState({ titleFilterString });
    }

    @bind
    public onTabSelect(selectedTabKey: string) {
        this.setState(
            {
                selectedTabKey,
            },
            this.loadDataDocs
        );
    }

    @decorate(memoizeOne)
    public _getDataDocs(
        dataDocs: IDataDoc[],
        favoriteDataDocIds: number[],
        recentDataDocIds: number[],
        userUid: number,
        titleFilterString: string,
        selectedTabKey: string
    ) {
        const lowerCaseTitleFilterString = (
            titleFilterString || ''
        ).toLowerCase();
        const filteredDataDocs = dataDocs.filter(
            (dataDoc) =>
                dataDoc &&
                dataDoc.title.toLowerCase().includes(lowerCaseTitleFilterString)
        );

        if (selectedTabKey === 'mine') {
            return filteredDataDocs.filter(
                (dataDoc) => dataDoc.owner_uid === userUid && !dataDoc.archived
            );
        } else if (selectedTabKey === 'favorite') {
            const favoriteDataDocIdsSet = new Set(favoriteDataDocIds);
            return filteredDataDocs.filter((dataDoc) =>
                favoriteDataDocIdsSet.has(dataDoc.id)
            );
        } else if (selectedTabKey === 'recent') {
            const recentDataDocIdsSet = new Set(recentDataDocIds);
            return filteredDataDocs.filter((dataDoc) =>
                recentDataDocIdsSet.has(dataDoc.id)
            );
        }

        return [];
    }

    @bind
    public getDataDocs(): IDataDoc[] {
        return this._getDataDocs(
            this.props.dataDocs,
            this.props.favoriteDataDocIds,
            this.props.recentDataDocIds,
            this.props.userUid,
            this.state.titleFilterString,
            this.state.selectedTabKey
        );
    }

    @bind
    public onDeleteDataDocClick(id, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        sendConfirm({
            header: 'Remove DataDoc',
            message: 'Are you sure to delete?',
            onConfirm: this.onDeleteDataDocConfirm.bind(this, id),
        });
    }

    @bind
    public onDeleteDataDocConfirm(id) {
        const dataDocs = this.getDataDocs();

        const dataDocIds = dataDocs.map((dataDoc) => dataDoc.id);
        const indexOfDeletedDoc = findIndex(
            dataDocIds,
            (docId) => docId === id
        );

        // We can only go to the next data doc if:
        //     - we found the original index of deleted data doc
        //     - there are more than 1 data doc
        const nextDocIndex =
            indexOfDeletedDoc >= 0 && dataDocIds.length > 1
                ? (indexOfDeletedDoc + 1) % dataDocIds.length
                : null;
        const nextDocId = dataDocIds?.[nextDocIndex];

        this.props.deleteDataDoc(id).then(() => {
            if (nextDocId != null) {
                this.props.history.push(
                    `/${this.props.match.params['env']}/datadoc/${nextDocId}/`
                );
            } else {
                this.props.history.push(
                    `/${this.props.match.params['env']}/datadoc/`
                );
            }
        });
    }

    @bind
    public onFavoriteDataDocClick(id, pinned, evt) {
        evt.preventDefault();
        evt.stopPropagation();

        const { unfavoriteDataDoc, favoriteDataDoc, userUid } = this.props;

        if (pinned) {
            unfavoriteDataDoc(userUid, id);
        } else {
            favoriteDataDoc(userUid, id);
        }
    }

    @bind
    public makeDataDocsListDOM() {
        const dataDocs = this.getDataDocs();
        if ((dataDocs || []).length === 0) {
            return null;
        }

        return (
            <Switch>
                <Route
                    path="/:env/datadoc/:docId/"
                    render={({ match }) =>
                        this._makeDataDocsListDOM(
                            dataDocs,
                            Number(match.params['docId'])
                        )
                    }
                />
                <Route
                    path="/:env/"
                    render={() => this._makeDataDocsListDOM(dataDocs, null)}
                />
            </Switch>
        );
    }

    @bind
    public _makeDataDocsListDOM(
        dataDocs: IDataDoc[],
        selectedDataDocId: number
    ) {
        const { match } = this.props;

        const listDOM = dataDocs.map((dataDoc) => {
            const docId = dataDoc.id;

            const className = classNames({
                analysis: true,
                selected: selectedDataDocId === docId,
            });

            return (
                <DataDocGridItem
                    key={docId}
                    dataDoc={dataDoc}
                    className={className}
                    url={`/${match.params['env']}/datadoc/${docId}/`}
                    onDeleteDataDocClick={this.onDeleteDataDocClick.bind(
                        this,
                        docId
                    )}
                    onFavoriteDataDocClick={this.onFavoriteDataDocClick.bind(
                        this,
                        docId
                    )}
                />
            );
        });

        return listDOM;
    }

    @bind
    public makeDataDocsDOM() {
        return this.makeDataDocsListDOM();
    }

    public render() {
        const { loadedFilterModes } = this.props;
        const { titleFilterString, selectedTabKey } = this.state;

        const loaded = loadedFilterModes[selectedTabKey];
        const dataDocsDOM = loaded ? this.makeDataDocsDOM() : <Loading />;

        return (
            <div className="DataDocNavigator">
                <div className="list-header flex-row">
                    <SearchBar
                        value={titleFilterString}
                        onSearch={this.onTitleFilter}
                        placeholder="Filter..."
                        transparent
                    />
                    <CreateDataDocButton />
                </div>
                <div>
                    <Tabs
                        selectedTabKey={selectedTabKey}
                        onSelect={this.onTabSelect}
                        items={navigatorTabs}
                        wide
                    />
                </div>

                <div className="data-docs">{dataDocsDOM}</div>
            </div>
        );
    }
}

function mapStateToProps(
    state: IStoreState,
    ownProps: IDataDocNavigatorOwnProps
) {
    return {
        dataDocs: dataDocsOrderedSelector(state),
        favoriteDataDocIds: state.dataDoc.favoriteDataDocIds,
        recentDataDocIds: state.dataDoc.recentDataDocIds,

        userUid: state.user.myUserInfo.uid,
        loadedFilterModes:
            state.dataDoc.loadedEnvironmentFilterMode[
                state.environment.currentEnvironmentId
            ] || {},
        environment: currentEnvironmentSelector(state),
    };
}

function mapDispatchToProps(
    dispatch: Dispatch,
    ownProps: IDataDocNavigatorOwnProps
) {
    return {
        loadDataDocs: (filterMode) =>
            dispatch(dataDocActions.fetchDataDocs(filterMode)),

        deleteDataDoc: (docId) => dispatch(dataDocActions.deleteDataDoc(docId)),

        favoriteDataDoc: (userId, docId) =>
            dispatch(dataDocActions.favoriteDataDoc(docId)),

        unfavoriteDataDoc: (userId, docId) =>
            dispatch(dataDocActions.unfavoriteDataDoc(docId)),
    };
}

export const DataDocNavigator = withRouter(
    connect(mapStateToProps, mapDispatchToProps)(DataDocNavigatorComponent)
);
