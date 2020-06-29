import React, { useState, useCallback, useEffect, useMemo } from 'react';
import * as classNames from 'classnames';

import { useSelector, useDispatch } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { dataDocsOrderedSelector } from 'redux/dataDoc/selector';
import * as dataDocActions from 'redux/dataDoc/action';
import { IStoreState, Dispatch } from 'redux/store/types';

import { CreateDataDocButton } from 'components/CreateDataDocButton/CreateDataDocButton';

import { Tabs, ITabItem } from 'ui/Tabs/Tabs';
import { Loading } from 'ui/Loading/Loading';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import { DataDocGridItem } from './DataDocGridItem';
import './DataDocNavigator.scss';

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
    const dataDocs = useSelector(dataDocsOrderedSelector);
    const favoriteDataDocIds = useSelector(
        (state: IStoreState) => state.dataDoc.favoriteDataDocIds
    );
    const recentDataDocIds = useSelector(
        (state: IStoreState) => state.dataDoc.recentDataDocIds
    );
    const userUid = useSelector(
        (state: IStoreState) => state.user.myUserInfo.uid
    );
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
    const [tabKey, setTabKey] = useState<string>(navigatorTabs[0].key);

    const match = useRouteMatch('/:env/:ignore(datadoc)?/:matchDocId?');
    const { env, matchDocId } = match?.params ?? {};
    const selectedDocId = useMemo(
        () => (matchDocId ? Number(matchDocId) : null),
        [matchDocId]
    );

    useEffect(() => {
        loadDataDocs(tabKey);
    }, [env, tabKey]);

    const dataDocsToShow = useMemo(() => {
        const lowerCaseTitleFilterString = titleFilterString.toLowerCase();
        const filteredDataDocs = dataDocs.filter(
            (dataDoc) =>
                dataDoc &&
                dataDoc.title.toLowerCase().includes(lowerCaseTitleFilterString)
        );

        if (tabKey === 'mine') {
            return filteredDataDocs.filter(
                (dataDoc) => dataDoc.owner_uid === userUid && !dataDoc.archived
            );
        } else if (tabKey === 'favorite') {
            const favoriteDataDocIdsSet = new Set(favoriteDataDocIds);
            return filteredDataDocs.filter((dataDoc) =>
                favoriteDataDocIdsSet.has(dataDoc.id)
            );
        } else if (tabKey === 'recent') {
            const recentDataDocIdsSet = new Set(recentDataDocIds);
            return filteredDataDocs.filter((dataDoc) =>
                recentDataDocIdsSet.has(dataDoc.id)
            );
        }

        return [];
    }, [
        titleFilterString,
        dataDocs,
        tabKey,
        favoriteDataDocIds,
        recentDataDocIds,
    ]);

    const makeDataDocListDOM = () => {
        const listDOM = dataDocsToShow.map((dataDoc) => {
            const docId = dataDoc.id;

            const className = classNames({
                selected: selectedDocId === docId,
            });

            return (
                <DataDocGridItem
                    key={docId}
                    dataDoc={dataDoc}
                    className={className}
                    url={`/${env}/datadoc/${docId}/`}
                />
            );
        });

        return listDOM;
    };

    const loaded = loadedFilterModes[tabKey];
    const dataDocsDOM = loaded ? makeDataDocListDOM() : <Loading />;

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
            <div>
                <Tabs
                    selectedTabKey={tabKey}
                    onSelect={setTabKey}
                    items={navigatorTabs}
                    wide
                />
            </div>

            <div className="data-docs">{dataDocsDOM}</div>
        </div>
    );
};
