import clsx from 'clsx';
import { decorate } from 'core-decorators';
import { ContentState } from 'draft-js';
import { findIndex } from 'lodash';
import { bind, debounce } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import React from 'react';
import toast from 'react-hot-toast';
import { connect } from 'react-redux';

import { DataDocCell } from 'components/DataDocCell/DataDocCell';
import { DataDocLeftSidebar } from 'components/DataDocLeftSidebar/DataDocLeftSidebar';
import { DataDocRightSidebar } from 'components/DataDocRightSidebar/DataDocRightSidebar';
import { DataDocTemplateCell } from 'components/DataDocTemplateButton/DataDocTemplateCell';
import {
    ISearchAndReplaceHandles,
    SearchAndReplace,
} from 'components/SearchAndReplace/SearchAndReplace';
import { ComponentType, ElementType } from 'const/analytics';
import {
    CELL_TYPE,
    DataCellUpdateFields,
    IDataCell,
    IDataCellMeta,
    IDataDoc,
    IDataDocMeta,
    IDataQueryCell,
} from 'const/datadoc';
import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';
import { DataDocContext, IDataDocContextType } from 'context/DataDoc';
import { trackClick, trackView } from 'lib/analytics';
import {
    deserializeCopyCommand,
    serializeCopyCommand,
} from 'lib/data-doc/copy';
import {
    getShareUrl,
    isCellEmpty,
    scrollToCell,
} from 'lib/data-doc/data-doc-utils';
import { replaceDataDoc, searchDataDocCells } from 'lib/data-doc/search';
import { sendConfirm, setBrowserTitle } from 'lib/querybookUI';
import history from 'lib/router-history';
import { copy, sanitizeUrlTitle } from 'lib/utils';
import { formatError, isAxiosError } from 'lib/utils/error';
import { KeyMap, matchKeyMap } from 'lib/utils/keyboard';
import { getQueryString } from 'lib/utils/query-string';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { IDataDocSavePromise } from 'redux/dataDoc/types';
import {
    closeDataDoc,
    openDataDoc,
} from 'redux/dataDocWebsocket/dataDocWebsocket';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import { Dispatch, IStoreState } from 'redux/store/types';
import { myUserInfoSelector } from 'redux/user/selector';
import { Loading } from 'ui/Loading/Loading';
import { Message } from 'ui/Message/Message';

import { DataDocCellControl } from './DataDocCellControl';
import { DataDocContentContainer } from './DataDocContentContainer';
import { DataDocError } from './DataDocError';
import { DataDocHeader } from './DataDocHeader';
import { DataDocLoading } from './DataDocLoading';

import './DataDoc.scss';

interface IOwnProps {
    docId: number;
}
type DataDocStateProps = ReturnType<typeof mapStateToProps>;
type DataDocDispatchProps = ReturnType<typeof mapDispatchToProps>;

type IProps = IOwnProps & DataDocStateProps & DataDocDispatchProps;

interface IState {
    focusedCellIndex?: number;
    errorObj?: React.ReactChild;
    // indicates whether or not datadoc is connected to websocket
    connected: boolean;
    defaultCollapseAllCells: boolean;
    cellIdToExecutionId: Record<number, number>;
    highlightCellIndex?: number;
    fullScreenCellIndex?: number;

    showSearchAndReplace: boolean;
}

class DataDocComponent extends React.PureComponent<IProps, IState> {
    public readonly state = {
        errorObj: null,
        focusedCellIndex: null,
        highlightCellIndex: null,
        fullScreenCellIndex: null,

        connected: false,
        defaultCollapseAllCells: null,
        cellIdToExecutionId: {},

        showSearchAndReplace: false,
    };

    private searchAndReplaceRef = React.createRef<ISearchAndReplaceHandles>();
    private focusCellIndexAfterInsert: number = null;

    // Show data doc title in url and document title
    @decorate(memoizeOne)
    public publishDataDocTitle(title: string) {
        setBrowserTitle(title || 'Untitled DataDoc');
        if (title) {
            const pathParts = location.pathname.split('/');
            const pathPrefix =
                pathParts[2] === '_' && pathParts[3] === 'embedded_datadoc'
                    ? pathParts.slice(0, 5).join('/')
                    : pathParts.slice(0, 4).join('/');

            history.replace(
                pathPrefix +
                    `/${sanitizeUrlTitle(title)}/` +
                    location.search +
                    location.hash
            );
        }
    }

    @bind
    public async openDataDoc(docId: number) {
        try {
            this.setState({
                errorObj: null,
                connected: false,
            });
            await this.props.openDataDoc(docId);
            this.setState({
                connected: true,
            });
        } catch (e) {
            this.setState({
                errorObj: e,
            });
        }
    }

    @bind
    public closeDataDoc(docId: number) {
        return this.props.closeDataDoc(docId);
    }

    @bind
    public focusCellAt(index: number) {
        this.setState(
            {
                focusedCellIndex: index,
            },
            () => {
                this.updateDocCursor(index);
                this.updateDocUrl();
            }
        );
    }

    @bind
    public fullScreenCellAt(index?: number) {
        this.searchAndReplaceRef.current.performSearch();
        this.setState({
            fullScreenCellIndex: index,
        });
    }

    @bind
    @debounce(500)
    public updateDocCursor(index: number) {
        const {
            docId,
            dataDoc: { dataDocCells },
        } = this.props;
        dataDocActions.moveDataDocCursor(docId, dataDocCells?.[index]?.id);
    }

    @bind
    @debounce(1000)
    public updateDocUrl(cellId?: number, executionId?: number) {
        const index = this.state.focusedCellIndex;
        const {
            dataDoc: { dataDocCells },
        } = this.props;

        cellId = cellId ?? (index != null ? dataDocCells?.[index]?.id : null);

        if (cellId != null) {
            executionId = executionId ?? this.state.cellIdToExecutionId[cellId];

            history.replace(getShareUrl(cellId, executionId, true));
        }
    }

    @bind
    public autoFocusCell(props: Partial<IProps>, nextProps: Partial<IProps>) {
        const { dataDoc: oldDataDoc } = props;
        const { dataDoc } = nextProps;

        if (!('cells' in (oldDataDoc || {})) && dataDoc && 'cells' in dataDoc) {
            const queryParam = getQueryString();
            if (queryParam && 'cellId' in queryParam) {
                const cellId = Number(queryParam['cellId']);

                if (dataDoc.dataDocCells) {
                    const cellIndex = findIndex(
                        dataDoc.dataDocCells,
                        (cell) => cell.id === cellId
                    );

                    if (cellIndex >= 0) {
                        // This is to quickly snap to the element, and then in case
                        // if the cell above/below pushes the element out of view we
                        // try to scroll it back
                        scrollToCell(
                            dataDoc.dataDocCells[cellIndex].id,
                            0
                        ).then(() =>
                            // Setting the highlight cell index to turn on the
                            // blue aura animation
                            this.setState(
                                {
                                    highlightCellIndex: cellIndex,
                                },
                                () => {
                                    scrollToCell(
                                        dataDoc.dataDocCells[cellIndex].id,
                                        200,
                                        5
                                    );
                                    // The highlight animation should last 5 seconds
                                    // Remove the index so subsequent render does not
                                    // show this
                                    setTimeout(
                                        () =>
                                            this.setState({
                                                highlightCellIndex: null,
                                            }),
                                        5000
                                    );
                                }
                            )
                        );
                    }
                }
            }
        }
    }

    @bind
    public onCellBlur(index: number) {
        if (index === this.state.focusedCellIndex) {
            this.focusCellAt(null);
        }
    }

    @bind
    public onCellFocus(index: number) {
        if (index !== this.state.focusedCellIndex) {
            this.focusCellAt(index);
        }
    }

    @bind
    public getSearchResults(
        searchString: string,
        searchOptions: ISearchOptions
    ) {
        // If a cell is full screen'ed, then only show
        // the full screen content
        const { fullScreenCellIndex } = this.state;
        const cells =
            fullScreenCellIndex == null
                ? this.props.dataDoc?.dataDocCells
                : this.props.dataDoc?.dataDocCells.slice(
                      fullScreenCellIndex,
                      fullScreenCellIndex + 1
                  );

        return searchDataDocCells(cells, searchString, searchOptions);
    }

    @bind
    public replace(
        searchResultsToReplace: ISearchResult[],
        replaceString: string
    ) {
        return replaceDataDoc(
            this.props.dataDoc,
            searchResultsToReplace,
            replaceString,
            (cellId, context) => this.updateCell(cellId, { context })
        );
    }

    @bind
    public async jumpToResult(result: ISearchResult) {
        const cellId = result?.cellId;
        if (cellId != null) {
            await scrollToCell(cellId, 0);
        }
    }

    @bind
    public async insertCellAt(
        index: number,
        cellType: CELL_TYPE,
        context: string,
        meta: IDataCellMeta
    ) {
        try {
            const dataDoc = this.props.dataDoc;
            if (dataDoc) {
                // After componentDidUpdate, this will focus the cell
                this.focusCellIndexAfterInsert = index;

                const previousQueryCell = dataDoc.dataDocCells
                    .slice(0, index)
                    .reverse()
                    .find(
                        (cell) => cell.cell_type === 'query'
                    ) as IDataQueryCell;
                const previousCellEngineId = previousQueryCell?.meta?.engine;

                await this.props.insertDataDocCell(
                    dataDoc.id,
                    index,
                    cellType,
                    context,
                    meta,
                    previousCellEngineId
                );
            }
        } catch (e) {
            toast.error(`Insert cell failed, reason: ${formatError(e)}`);
        }
    }

    @bind
    public async pasteCellAt(pasteIndex: number) {
        trackClick({
            component: ComponentType.DATADOC_PAGE,
            element: ElementType.PASTE_CELL_BUTTON,
        });

        let clipboardContent = null;
        try {
            if (navigator.clipboard.readText) {
                clipboardContent = await navigator.clipboard.readText();
            }
        } catch (e) {
            // ignore if user rejected, handle in finally
        } finally {
            if (clipboardContent == null) {
                // If we failed to get content due to:
                //    - firefox doesn't have navigator.clipboard.readText
                //    - user refused to give clipboard permission
                // then we show the prompt as a last resort
                clipboardContent = prompt('Paste copied cell here');
            }
        }

        const copyCommand = deserializeCopyCommand(clipboardContent);
        if (copyCommand) {
            try {
                await dataDocActions.pasteDataCell(
                    copyCommand.cellId,
                    copyCommand.cut,
                    this.props.docId,
                    pasteIndex
                );
                // Empty clipboard if copy is success
                copy('');
                toast.success('Pasted');
            } catch (e) {
                toast.error('Failed to paste, reason: ' + formatError(e));
            }
        } else {
            toast.error('Nothing to paste, skipping.');
        }
    }

    @bind
    public copyCellAt(index: number, cut: boolean) {
        trackClick({
            component: ComponentType.DATADOC_PAGE,
            element: cut
                ? ElementType.CUT_CELL_BUTTON
                : ElementType.COPY_CELL_BUTTON,
        });
        copy(
            serializeCopyCommand({
                cellId: this.props.dataDoc.cells[index],
                cut,
            })
        );
        toast('Copied.' + (cut ? ' Cell will be moved after paste. ' : ''));
    }

    @bind
    public deleteCellAt(index: number) {
        const { dataDoc, docId } = this.props;

        const numberOfCells = dataDoc.dataDocCells.length;
        const cell = dataDoc.dataDocCells[index];
        const cellIsEmpty = isCellEmpty(cell);

        return new Promise<void>((resolve) => {
            if (numberOfCells > 0) {
                const shouldConfirm = !cellIsEmpty;
                const deleteCell = async () => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.DELETE_CELL_BUTTON,
                    });
                    try {
                        await dataDocActions.deleteDataDocCell(docId, cell.id);
                    } catch (e) {
                        toast.error(
                            `Delete cell failed, reason: ${formatError(e)}`
                        );
                    } finally {
                        resolve();
                    }
                };
                if (shouldConfirm) {
                    sendConfirm({
                        header: 'Delete Cell?',
                        message: 'Deleted cells cannot be recovered',
                        onConfirm: deleteCell,
                        onHide: resolve,
                        confirmColor: 'cancel',
                        cancelColor: 'default',
                    });
                } else {
                    deleteCell().finally(resolve);
                }
            } else {
                resolve();
            }
        });
    }

    @bind
    public updateCell(cellId: number, fields: DataCellUpdateFields) {
        return this.props.updateDataDocCell(this.props.docId, cellId, fields);
    }

    @bind
    public handleToggleCollapse() {
        this.setState(({ defaultCollapseAllCells }) => ({
            defaultCollapseAllCells: !defaultCollapseAllCells,
        }));
    }

    @bind
    public onCloneButtonClick() {
        const {
            cloneDataDoc,
            environment,
            dataDoc: { id },
        } = this.props;
        sendConfirm({
            header: 'Clone DataDoc?',
            message:
                'You will be redirected to the new Data Doc after cloning.',
            onConfirm: () => {
                trackClick({
                    component: ComponentType.DATADOC_PAGE,
                    element: ElementType.CLONE_DATADOC_BUTTON,
                });
                toast.promise(
                    cloneDataDoc(id).then((dataDoc) =>
                        history.push(
                            `/${environment.name}/datadoc/${dataDoc.id}/`
                        )
                    ),
                    {
                        loading: 'Cloning DataDoc...',
                        success: 'Clone Success!',
                        error: 'Cloning failed.',
                    }
                );
            },
            cancelColor: 'default',
            confirmIcon: 'Copy',
        });
    }

    @bind
    public onQuerycellSelectExecution(cellId: number, executionId: number) {
        this.setState(
            ({ cellIdToExecutionId: oldCellIdToExecutionId }) => ({
                cellIdToExecutionId: {
                    ...oldCellIdToExecutionId,
                    [cellId]: executionId,
                },
            }),
            () => {
                this.updateDocUrl(cellId, executionId);
            }
        );
    }

    @decorate(memoizeOne)
    public _getCellFocusProps() {
        return {
            onUpKeyPressed: (index: number) => this.focusCellAt(index - 1),
            onDownKeyPressed: (index: number) => this.focusCellAt(index + 1),
            onFocus: this.onCellFocus,
            onBlur: this.onCellBlur,
        };
    }

    @bind
    @decorate(memoizeOne)
    public _getDataDocContextState(
        isEditable: boolean,
        defaultCollapse: boolean,
        fullScreenCellIndex: number,
        highlightCellIndex: number,
        cellIdToExecutionId: Record<number, number>
    ): IDataDocContextType {
        return {
            cellIdToExecutionId,
            onQueryCellSelectExecution: this.onQuerycellSelectExecution,

            insertCellAt: this.insertCellAt,
            updateCell: this.updateCell,
            copyCellAt: this.copyCellAt,
            pasteCellAt: this.pasteCellAt,
            deleteCellAt: this.deleteCellAt,

            fullScreenCellAt: this.fullScreenCellAt,

            defaultCollapse,
            highlightCellIndex,
            fullScreenCellIndex,

            cellFocus: this._getCellFocusProps(),
            isEditable,
        };
    }

    @bind
    public getDataDocContextState() {
        return this._getDataDocContextState(
            this.props.isEditable,
            this.state.defaultCollapseAllCells,
            this.state.fullScreenCellIndex,
            this.state.highlightCellIndex,
            this.state.cellIdToExecutionId
        );
    }

    @decorate(memoizeOne)
    public getSavingInfo(
        dataDoc: IDataDoc,
        dataDocCells: IDataCell[],
        dataDocSavePromise: IDataDocSavePromise
    ) {
        const isSaving =
            dataDocSavePromise != null &&
            Object.keys(dataDocSavePromise.itemToSave).length > 0;

        return {
            isSaving,
            lastUpdated:
                (dataDocSavePromise && dataDocSavePromise.lastUpdatedAt) ||
                Math.max(
                    dataDoc.updated_at,
                    ...dataDocCells.map((cell) => cell.updated_at)
                ),
        };
    }

    @bind
    public onKeyDown(event: KeyboardEvent) {
        let stopEvent = false;

        if (event.repeat) {
            return;
        }

        if (matchKeyMap(event, KeyMap.dataDoc.saveDataDoc)) {
            stopEvent = true;
            this.props.forceSaveDataDoc(this.props.docId);
        } else if (matchKeyMap(event, KeyMap.dataDoc.copyCell)) {
            const { focusedCellIndex } = this.state;
            if (focusedCellIndex != null) {
                stopEvent = true;
                this.copyCellAt(this.state.focusedCellIndex, false);
            }
        } else if (matchKeyMap(event, KeyMap.dataDoc.pasteCell)) {
            const { focusedCellIndex } = this.state;
            if (focusedCellIndex != null) {
                stopEvent = true;
                this.pasteCellAt(this.state.focusedCellIndex);
            }
        } else if (matchKeyMap(event, KeyMap.dataDoc.deleteCell)) {
            const { focusedCellIndex } = this.state;
            if (focusedCellIndex != null) {
                stopEvent = true;
                this.deleteCellAt(this.state.focusedCellIndex);
            }
        }

        if (stopEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    @bind
    public renderLazyDataDocCell(
        cell: IDataCell,
        index: number,
        numberOfCells: number,
        lastQueryCellId: number,
        queryIndexInDoc: number
    ) {
        const { dataDoc, isEditable } = this.props;
        const { focusedCellIndex } = this.state;

        const insertCellAtBinded = this.insertCellAt;

        if (!cell) {
            // Force show control when there are no data doc cells
            const forceShow = numberOfCells === 0;
            return (
                // Empty row to add new item
                <div
                    className="data-doc-cell-container-pair data-doc-cell-container-pair-final"
                    key={'final-extra-cell'}
                >
                    <div className="data-doc-cell-divider-container">
                        <DataDocCellControl
                            index={index}
                            numberOfCells={numberOfCells}
                            insertCellAt={insertCellAtBinded}
                            isHeader={true}
                            active={forceShow}
                            isEditable={isEditable}
                            pasteCellAt={this.pasteCellAt}
                        />
                    </div>
                </div>
            );
        } else {
            return (
                <DataDocCell
                    key={cell.id}
                    docId={dataDoc.id}
                    numberOfCells={dataDoc.dataDocCells.length}
                    templatedVariables={dataDoc.meta.variables}
                    cell={cell}
                    index={index}
                    queryIndexInDoc={queryIndexInDoc}
                    lastQueryCellId={lastQueryCellId}
                    isFocused={focusedCellIndex === index}
                />
            );
        }
    }

    @bind
    public renderDataDocCells(numberOfCells: number) {
        const cellDOMs = [];
        const { dataDoc } = this.props;
        const dataDocCells = dataDoc.dataDocCells || [];
        let lastQueryCellId: number = null;
        let queryIndexInDoc = 0;

        for (let i = 0; i < numberOfCells + 1; i++) {
            const cell = dataDocCells[i];
            cellDOMs.push(
                this.renderLazyDataDocCell(
                    cell,
                    i,
                    numberOfCells,
                    lastQueryCellId,
                    queryIndexInDoc
                )
            );

            const isQueryCell = cell && cell.cell_type === 'query';
            if (isQueryCell) {
                queryIndexInDoc++;
                lastQueryCellId = cell.id;
            }
        }

        return cellDOMs;
    }

    @bind
    public renderDataDoc() {
        const {
            isEditable,

            dataDoc,
            dataDocSavePromise,
            changeDataDocTitle,
            changeDataDocMeta,
        } = this.props;

        const { connected, defaultCollapseAllCells } = this.state;

        let docDOM = null;
        let isSavingDataDoc = false;

        // This is a hacky way to see if dataDoc is loaded
        // TODO(querybook): make a clean version for loading logic of dataDoc
        if (dataDoc && 'cells' in dataDoc) {
            const archiveMessageDOM = dataDoc.archived && (
                <Message
                    title={'This DataDoc is archived'}
                    message={'Archived DataDocs are readonly.'}
                    type="error"
                />
            );

            const { isSaving, lastUpdated } = this.getSavingInfo(
                dataDoc,
                dataDoc.dataDocCells,
                dataDocSavePromise
            );
            isSavingDataDoc = isSaving;

            const docClassName = clsx({
                'data-doc-container': true,
                readonly: !isEditable,
            });

            docDOM = (
                <DataDocContentContainer>
                    {archiveMessageDOM}
                    <DataDocHeader
                        dataDoc={dataDoc}
                        isEditable={isEditable}
                        changeDataDocTitle={changeDataDocTitle}
                        isSaving={isSaving}
                        lastUpdated={lastUpdated}
                    />
                    <div className={docClassName}>
                        <DataDocTemplateCell
                            dataDoc={dataDoc}
                            isEditable={isEditable}
                            changeDataDocMeta={changeDataDocMeta}
                        />
                        {this.renderDataDocCells(
                            (dataDoc.dataDocCells || []).length
                        )}
                    </div>
                </DataDocContentContainer>
            );
        } else {
            docDOM = <DataDocLoading />;
        }

        const leftSideBar = (
            <DataDocLeftSidebar
                docId={dataDoc.id}
                cells={dataDoc.dataDocCells}
            />
        );

        const rightSideBar = (
            <DataDocRightSidebar
                dataDoc={dataDoc}
                changeDataDocMeta={changeDataDocMeta}
                onClone={this.onCloneButtonClick}
                isSaving={isSavingDataDoc}
                isEditable={isEditable}
                isConnected={connected}
                defaultCollapse={defaultCollapseAllCells}
                onCollapse={this.handleToggleCollapse}
            />
        );

        return (
            <div
                className={clsx({
                    DataDoc: true,
                })}
                key="querybook-data-doc"
            >
                <DataDocContext.Provider value={this.getDataDocContextState()}>
                    <SearchAndReplace
                        getSearchResults={this.getSearchResults}
                        jumpToResult={this.jumpToResult}
                        replace={this.replace}
                        ref={this.searchAndReplaceRef}
                    >
                        {leftSideBar}
                        {docDOM}
                        {rightSideBar}
                    </SearchAndReplace>
                </DataDocContext.Provider>
            </div>
        );
    }

    public componentDidMount() {
        trackView(ComponentType.DATADOC_PAGE);
        this.autoFocusCell({}, this.props);
        this.openDataDoc(this.props.docId);
        this.publishDataDocTitle(this.props.dataDoc?.title);
        window.addEventListener('keydown', this.onKeyDown, true);
    }

    public componentDidUpdate(prevProps) {
        this.autoFocusCell(prevProps, this.props);

        if (this.props.docId !== prevProps.docId) {
            // No need to close because openDataDoc would auto-close
            if (prevProps.docId != null) {
                this.props.forceSaveDataDoc(prevProps.docId);

                // Reset all the state variables
                this.setState({
                    defaultCollapseAllCells: null,
                    focusedCellIndex: null,

                    // Sharing State
                    cellIdToExecutionId: {},
                    highlightCellIndex: null,
                });
                // Reset search
                this.searchAndReplaceRef.current?.reset();
            }
            this.openDataDoc(this.props.docId);
        }

        if (
            this.props.dataDoc?.dataDocCells !== prevProps.dataDoc?.dataDocCells
        ) {
            const cells = this.props.dataDoc?.dataDocCells ?? [];
            const previousCells = prevProps.dataDoc?.dataDocCells ?? [];
            const someCellsContextChanged =
                cells.length !== previousCells.length ||
                cells.some(
                    (cell, index) =>
                        cell.context !== previousCells[index].context
                );

            if (someCellsContextChanged) {
                this.searchAndReplaceRef.current?.performSearch();
            }

            // When a cell is inserted, the length will be changed
            // during this time we will focus the new inserted cell
            const cellLengthChanged = cells.length !== previousCells.length;
            if (cellLengthChanged && this.focusCellIndexAfterInsert != null) {
                const cellIndexToFocus = this.focusCellIndexAfterInsert;
                setImmediate(() => {
                    // setting focus cell during componentDidUpdate would not
                    // actually focus the cell, we need to do it in another event loop
                    this.focusCellAt(cellIndexToFocus);
                });
                this.focusCellIndexAfterInsert = null;
            }
        }

        if (
            this.props.dataDoc?.title !== prevProps.dataDoc?.title &&
            this.props.dataDoc?.title != null
        ) {
            this.publishDataDocTitle(this.props.dataDoc.title);
        }
    }

    public componentWillUnmount() {
        this.closeDataDoc(this.props.docId);
        window.removeEventListener('keydown', this.onKeyDown, true);
    }

    public render() {
        const { dataDoc } = this.props;
        const { errorObj } = this.state;

        if (isAxiosError(errorObj)) {
            return (
                <DataDocError docId={this.props.docId} errorObj={errorObj} />
            );
        }
        if (!(dataDoc && dataDoc.cells)) {
            return <Loading fullHeight />;
        }

        return this.renderDataDoc();
    }
}

function mapStateToProps(state: IStoreState, ownProps: IOwnProps) {
    const userInfo = myUserInfoSelector(state);
    const dataDoc = dataDocSelectors.dataDocSelector(state, ownProps.docId);
    const dataDocSavePromise =
        state.dataDoc.dataDocSavePromiseById[ownProps.docId];

    const isEditable = dataDocSelectors.canCurrentUserEditSelector(
        state,
        ownProps.docId
    );
    const userIds = dataDocSelectors.dataDocViewerIdsSelector(
        state,
        ownProps.docId
    );

    return {
        userInfo,
        arrowKeysEnabled:
            state.user.computedSettings.datadoc_arrow_key === 'enabled',
        dataDoc,
        dataDocSavePromise,
        isEditable,
        userIds,
        environment: currentEnvironmentSelector(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
    return {
        openDataDoc: (id: number) => dispatch(openDataDoc(id)),
        closeDataDoc: (id: number) => dispatch(closeDataDoc(id)),

        forceSaveDataDoc: (id: number) =>
            dispatch(dataDocActions.forceSaveDataDoc(id)),

        changeDataDocTitle: (docId: number, newTitle: string) => {
            dispatch(
                dataDocActions.updateDataDocField(docId, 'title', newTitle)
            );
        },

        changeDataDocMeta: (docId: number, meta: IDataDocMeta) =>
            dispatch(dataDocActions.updateDataDocField(docId, 'meta', meta)),

        cloneDataDoc: (docId: number) =>
            dispatch(dataDocActions.cloneDataDoc(docId)),

        insertDataDocCell: (
            docId: number,
            index: number,
            cellType: CELL_TYPE,
            context: string | ContentState,
            meta: IDataCellMeta,
            previousEngineId: number
        ) =>
            dispatch(
                dataDocActions.insertDataDocCell(
                    docId,
                    index,
                    cellType,
                    context,
                    meta,
                    previousEngineId
                )
            ),

        updateDataDocCell: async (
            docId: number,
            cellId: number,
            fields: DataCellUpdateFields
        ) => {
            try {
                // Await the result so it can be caught by
                // try catch
                return await dispatch(
                    dataDocActions.updateDataDocCell(
                        docId,
                        cellId,
                        fields.context,
                        fields.meta
                    )
                );
            } catch (e) {
                toast.error(`Cannot update cell, reason: ${formatError(e)}`);
            }
        },
    };
}

export const DataDoc = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocComponent);
