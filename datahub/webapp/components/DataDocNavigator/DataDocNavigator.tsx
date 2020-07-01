import React, { useState, useCallback, useEffect, useMemo } from 'react';
import * as classNames from 'classnames';

import { useSelector, useDispatch } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import {
    dataDocsOrderedSelector,
    recentDataDocsSelector,
    favoriteDataDocsSelector,
    dataDocsMineUncategorizedSelector,
} from 'redux/dataDoc/selector';
import * as dataDocActions from 'redux/dataDoc/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import { CreateDataDocButton } from 'components/CreateDataDocButton/CreateDataDocButton';

import { Tabs, ITabItem } from 'ui/Tabs/Tabs';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import { DataDocGridItem } from './DataDocGridItem';
import './DataDocNavigator.scss';
import { DataDocNavigatorSection } from './DataDocNavigatorSection';
import { IDataDoc } from 'const/datadoc';
import { DataDocNavigatorBoardSection } from './DataDocNavigatorBoardSection';

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

export const DataDocNavigator: React.FC<{}> = ({}) => {
    const loadedFilterModes = useSelector(
        (state: IStoreState) =>
            state.dataDoc.loadedEnvironmentFilterMode[
                state.environment.currentEnvironmentId
            ] ?? {}
    );

    const dispatch: Dispatch = useDispatch();
    const loadDataDocs = useCallback(
        (filterMode: string) =>
            dispatch(dataDocActions.fetchDataDocs(filterMode)),
        []
    );

    const [titleFilterString, setTitleFilterString] = useState('');

    const match = useRouteMatch('/:env/:ignore(datadoc)?/:matchDocId?');
    const { matchDocId } = match?.params ?? {};
    const selectedDocId = useMemo(
        () => (matchDocId ? Number(matchDocId) : null),
        [matchDocId]
    );

    const lowerCaseTitleFilterString = useMemo(
        () => titleFilterString.toLowerCase(),
        [titleFilterString]
    );

    const commonSectionProps = {
        selectedDocId,
        loadDataDocs,
        filterString: lowerCaseTitleFilterString,
        loadedFilterModes,
    };

    return (
        <div className="DataDocNavigator">
            <div className="list-header flex-row">
                <SearchBar
                    value={titleFilterString}
                    onSearch={setTitleFilterString}
                    placeholder="Filter..."
                    transparent
                />
                <CreateDataDocButton />
            </div>
            <div className="data-docs">
                <RecentDataDocsSection {...commonSectionProps} />
                <FavoriteDataDocsSection {...commonSectionProps} />
                <DataDocNavigatorBoardSection selectedDocId={selectedDocId} />
                <MineDataDocsSection {...commonSectionProps} />
            </div>
        </div>
    );
};

interface ICommonSectionProps {
    selectedDocId: number;
    loadedFilterModes: Record<string, boolean>;
    loadDataDocs: (filterMode: string) => any;
    filterString: string;
}

function useFilteredDataDocs(dataDocs: IDataDoc[], filterString: string) {
    const filteredDataDocs = useMemo(
        () =>
            dataDocs.filter(
                (dataDoc) =>
                    dataDoc &&
                    dataDoc.title.toLowerCase().includes(filterString)
            ),
        [dataDocs, filterString]
    );
    return filteredDataDocs;
}

const RecentDataDocsSection: React.FC<ICommonSectionProps> = ({
    selectedDocId,
    loadedFilterModes,
    loadDataDocs,
    filterString,
}) => {
    const section = 'recent';
    const dataDocs = useFilteredDataDocs(
        useSelector(recentDataDocsSelector),
        filterString
    );
    const load = useCallback(() => loadDataDocs(section), [loadDataDocs]);
    return (
        <DataDocNavigatorSection
            sectionHeader={section}
            dataDocs={dataDocs}
            selectedDocId={selectedDocId}
            loaded={!!loadedFilterModes[section]}
            loadDataDocs={load}
        />
    );
};

const FavoriteDataDocsSection: React.FC<ICommonSectionProps> = ({
    selectedDocId,
    loadedFilterModes,
    loadDataDocs,
    filterString,
}) => {
    const section = 'favorite';
    const dataDocs = useFilteredDataDocs(
        useSelector(favoriteDataDocsSelector),
        filterString
    );
    const load = useCallback(() => loadDataDocs(section), [loadDataDocs]);
    return (
        <DataDocNavigatorSection
            sectionHeader={section}
            dataDocs={dataDocs}
            selectedDocId={selectedDocId}
            loaded={!!loadedFilterModes[section]}
            loadDataDocs={load}
            defaultCollapsed
        />
    );
};

const MineDataDocsSection: React.FC<ICommonSectionProps> = ({
    selectedDocId,
    loadedFilterModes,
    loadDataDocs,
    filterString,
}) => {
    const section = 'mine';
    const dataDocs = useFilteredDataDocs(
        useSelector(dataDocsMineUncategorizedSelector),
        filterString
    );
    const load = useCallback(() => loadDataDocs(section), [loadDataDocs]);
    return (
        <DataDocNavigatorSection
            dataDocs={dataDocs}
            selectedDocId={selectedDocId}
            loaded={!!loadedFilterModes[section]}
            loadDataDocs={load}
        />
    );
};
