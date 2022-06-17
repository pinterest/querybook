import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import { useRouteMatch } from 'react-router-dom';

import { CreateDataDocButton } from 'components/CreateDataDocButton/CreateDataDocButton';
import { IDataDoc } from 'const/datadoc';
import * as dataDocActions from 'redux/dataDoc/action';
import {
    dataDocsMineSelector,
    favoriteDataDocsSelector,
    recentDataDocsSelector,
} from 'redux/dataDoc/selector';
import {
    getDataDocNavSectionConfigFromStore,
    setDataDocNavSection,
} from 'redux/querybookUI/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { IDragItem } from 'ui/DraggableList/types';
import { SearchBar } from 'ui/SearchBar/SearchBar';

import { DataDocNavigatorBoardSection } from './DataDocNavigatorBoardSection';
import { DataDocNavigatorSection } from './DataDocNavigatorSection';
import {
    BoardDraggableType,
    DataDocDraggableType,
    IProcessedBoardItem,
} from './navigatorConst';

import './DataDocNavigator.scss';

export const DataDocNavigator: React.FC = () => {
    const loadedFilterModes =
        useSelector(
            (state: IStoreState) =>
                state.dataDoc.loadedEnvironmentFilterMode[
                    state.environment.currentEnvironmentId
                ]
        ) ?? {};

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

    const sectionOpen = useSelector(
        (state: IStoreState) => state.querybookUI.dataDocNavigatorSectionOpen
    );
    const setSectionOpen = useCallback(
        (section: string, value: boolean) =>
            dispatch(setDataDocNavSection(section, value)),
        []
    );
    useEffect(() => {
        dispatch(getDataDocNavSectionConfigFromStore());
    }, []);

    const { collapsed: boardsCollapsed, setCollapsed: setBoardsCollapsed } =
        useBoundSectionState('boards', sectionOpen, setSectionOpen);

    const commonSectionProps = {
        selectedDocId,
        loadDataDocs,
        filterString: lowerCaseTitleFilterString,
        loadedFilterModes,

        sectionOpen,
        setSectionOpen,
    };

    return (
        <div className="DataDocNavigator SidebarNavigator">
            <div className="list-header flex-row">
                <SearchBar
                    value={titleFilterString}
                    onSearch={setTitleFilterString}
                    placeholder="Search by Title"
                    transparent
                />
                <CreateDataDocButton />
            </div>
            <div className="list-content data-docs">
                <RecentDataDocsSection {...commonSectionProps} />
                <FavoriteDataDocsSection {...commonSectionProps} />
                <DataDocNavigatorBoardSection
                    filterString={titleFilterString}
                    selectedDocId={selectedDocId}
                    collapsed={boardsCollapsed}
                    setCollapsed={setBoardsCollapsed}
                />
                <MyDataDocsSection {...commonSectionProps} />
            </div>
        </div>
    );
};

interface ICommonSectionProps {
    selectedDocId: number;
    loadedFilterModes: Record<string, boolean>;
    loadDataDocs: (filterMode: string) => any;
    filterString: string;

    sectionOpen: Record<string, boolean>;
    setSectionOpen: (sectionHeader: string, value: boolean) => any;
}

function useBoundSectionState(
    section: string,
    sectionOpen: Record<string, boolean>,
    setSectionOpen: (sectionHeader: string, value: boolean) => any
) {
    const collapsed = !sectionOpen[section];
    const setCollapsed = useCallback(
        (newCollapsed: boolean) => {
            setSectionOpen(section, !newCollapsed);
        },
        [section, setSectionOpen]
    );

    return { collapsed, setCollapsed };
}

function useCommonNavigatorState(section: string, props: ICommonSectionProps) {
    const { collapsed, setCollapsed } = useBoundSectionState(
        section,
        props.sectionOpen,
        props.setSectionOpen
    );

    const load = useCallback(
        () => props.loadDataDocs(section),
        [props.loadDataDocs]
    );

    return {
        collapsed,
        setCollapsed,
        load,
    };
}

const RecentDataDocsSection: React.FC<ICommonSectionProps> = (props) => {
    const { selectedDocId, loadedFilterModes, filterString } = props;
    const section = 'recent';
    const { collapsed, setCollapsed, load } = useCommonNavigatorState(
        section,
        props
    );
    const dataDocs = useSelector(recentDataDocsSelector);
    return (
        <DataDocNavigatorSection
            sectionHeaderIcon="Watch"
            sectionHeader={section}
            dataDocs={dataDocs}
            selectedDocId={selectedDocId}
            filterString={filterString}
            loaded={!!loadedFilterModes[section]}
            loadDataDocs={load}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
        />
    );
};

const FavoriteDataDocsSection: React.FC<ICommonSectionProps> = (props) => {
    const { selectedDocId, loadedFilterModes, filterString } = props;
    const section = 'favorite';
    const { collapsed, setCollapsed, load } = useCommonNavigatorState(
        section,
        props
    );
    const dataDocs = useSelector(favoriteDataDocsSelector);
    const dispatch = useDispatch();

    const [{ isOver }, dropRef] = useDrop({
        accept: [BoardDraggableType, DataDocDraggableType],
        drop: (item: IDragItem<IDataDoc | IProcessedBoardItem>, monitor) => {
            if (monitor.didDrop()) {
                return;
            }
            let docId: number = null;
            if (item.type === BoardDraggableType) {
                const itemInfo = item.itemInfo as IProcessedBoardItem;
                if (itemInfo.itemType === 'data_doc') {
                    docId = itemInfo.itemId;
                }
            } else {
                docId = (item.itemInfo as IDataDoc).id;
            }

            if (docId != null) {
                dispatch(dataDocActions.favoriteDataDoc(docId));
            }
        },

        collect: (monitor) => {
            const item: IDragItem = monitor.getItem();
            return {
                isOver:
                    item?.type === BoardDraggableType &&
                    (item?.itemInfo as unknown as IProcessedBoardItem)
                        .itemType === 'table'
                        ? false
                        : monitor.isOver(),
            };
        },
    });
    const handleUnfavoriteDataDoc = useCallback(
        (dataDoc: IDataDoc) =>
            dispatch(dataDocActions.unfavoriteDataDoc(dataDoc.id)),
        []
    );

    return (
        <div
            className={isOver ? 'nav-favorite-dragged-over' : ''}
            ref={dropRef}
        >
            <DataDocNavigatorSection
                sectionHeader={'Favorites'}
                sectionHeaderIcon="Star"
                dataDocs={dataDocs}
                selectedDocId={selectedDocId}
                filterString={filterString}
                loaded={!!loadedFilterModes[section]}
                loadDataDocs={load}
                collapsed={collapsed}
                setCollapsed={setCollapsed}
                onRemove={handleUnfavoriteDataDoc}
                allowReorder
            />
        </div>
    );
};

const MyDataDocsSection: React.FC<ICommonSectionProps> = (props) => {
    const { selectedDocId, loadedFilterModes, filterString } = props;
    const section = 'mine';
    const { collapsed, setCollapsed, load } = useCommonNavigatorState(
        section,
        props
    );
    const dataDocs = useSelector(dataDocsMineSelector);

    return (
        <DataDocNavigatorSection
            sectionHeader="my docs"
            sectionHeaderIcon="FileText"
            dataDocs={dataDocs}
            selectedDocId={selectedDocId}
            filterString={filterString}
            loaded={!!loadedFilterModes[section]}
            loadDataDocs={load}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            allowReorder
        />
    );
};
