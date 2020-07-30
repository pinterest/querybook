import React from 'react';
import { connect } from 'react-redux';
import { ContentState } from 'draft-js';
import { findIndex } from 'lodash';
import { bind, debounce } from 'lodash-decorators';

import { decorate } from 'core-decorators';
import memoizeOne from 'memoize-one';
import classNames from 'classnames';

import {
    CELL_TYPE,
    IDataDoc,
    IDataCell,
    DataCellUpdateFields,
} from 'const/datadoc';
import ds from 'lib/datasource';
import history from 'lib/router-history';
import { sendConfirm, sendNotification, setBrowserTitle } from 'lib/dataHubUI';
import { scrollToCell, getShareUrl } from 'lib/data-doc/data-doc-utils';
import { sanitizeUrlTitle, copy } from 'lib/utils';
import { getQueryString } from 'lib/utils/query-string';
import { matchKeyPress } from 'lib/utils/keyboard';
import {
    deserializeCopyCommand,
    serializeCopyCommand,
} from 'lib/data-doc/copy';

import {
    closeDataDoc,
    openDataDoc,
} from 'redux/dataDocWebsocket/dataDocWebsocket';
import * as dataDocActions from 'redux/dataDoc/action';
import { currentEnvironmentSelector } from 'redux/environment/selector';
import * as dataDocSelectors from 'redux/dataDoc/selector';
import { myUserInfoSelector } from 'redux/user/selector';
import { IStoreState, Dispatch } from 'redux/store/types';
import { IDataDocSavePromise } from 'redux/dataDoc/types';

import { IDataDocContextType, DataDocContext } from 'context/DataDoc';
import { DataDocLeftSidebar } from 'components/DataDocLeftSidebar/DataDocLeftSidebar';
import { DataDocRightSidebar } from 'components/DataDocRightSidebar/DataDocRightSidebar';
import { DataDocUIGuide } from 'components/UIGuide/DataDocUIGuide';
import { DataDocCell } from 'components/DataDocCell/DataDocCell';

import { Message } from 'ui/Message/Message';
import { Loading } from 'ui/Loading/Loading';

import { DataDocHeader } from './DataDocHeader';
import { DataDocCellControl } from './DataDocCellControl';
import { DataDocError } from './DataDocError';
import { DataDocContentContainer } from './DataDocContentContainer';

import './DataDoc.scss';
import { DataDocLoading } from './DataDocLoading';

import { searchDataDoc, replaceDataDoc } from 'lib/data-doc/search';
import {
    ISearchAndReplaceHandles,
    SearchAndReplace,
} from 'components/SearchAndReplace/SearchAndReplace';
import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';

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

    showSearchAndReplace: boolean;
}

class DataDocComponent extends React.Component<IProps, IState> {
    public readonly state = {
        errorObj: null,
        focusedCellIndex: null,
        highlightCellIndex: null,

        connected: false,
        defaultCollapseAllCells: null,
        cellIdToExecutionId: {},

        showSearchAndReplace: false,
    };

    private searchAndReplaceRef = React.createRef<ISearchAndReplaceHandles>();
    private focusCellIndexAfterInsert: number = null;

    public componentDidMount() {
        this.autoFocusCell({}, this.props);
        this.openDataDoc(this.props.docId);

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
                this.focusCellAt(this.focusCellIndexAfterInsert);
                this.focusCellIndexAfterInsert = null;
            }
        }

        if (
            this.props.dataDoc?.title !== prevProps.dataDoc?.title &&
            this.props.dataDoc?.title
        ) {
            this.publishDataDocTitle(this.props.dataDoc.title);
        }
    }

    // Show data doc title in url and document title
    @decorate(memoizeOne)
    public publishDataDocTitle(title: string) {
        title = title || 'Untitled';
        setBrowserTitle(title);
        history.replace(
            location.pathname.split('/').slice(0, 4).join('/') +
                `/${sanitizeUrlTitle(title)}/` +
                location.search +
                location.hash
        );
    }

    public componentWillUnmount() {
        this.closeDataDoc(this.props.docId);
        window.removeEventListener('keydown', this.onKeyDown, true);
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
        return closeDataDoc(docId);
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
    @debounce(200)
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
                        (cell) => {
                            return cell.id === cellId;
                        }
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
        // This is to resolve a race condition
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
        return searchDataDoc(this.props.dataDoc, searchString, searchOptions);
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
        meta: {}
    ) {
        try {
            const dataDoc = this.props.dataDoc;
            if (dataDoc) {
                // After componentDidUpdate, this will focus the cell
                this.focusCellIndexAfterInsert = index;

                await this.props.insertDataDocCell(
                    dataDoc.id,
                    index,
                    cellType,
                    context,
                    meta
                );
            }
        } catch (e) {
            sendNotification(`Insert cell failed, reason: ${e}`);
        }
    }

    @bind
    public async pasteCellAt(pasteIndex: number) {
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
                sendNotification('Pasted');
            } catch (e) {
                sendNotification('Failed to paste, reason: ' + String(e));
            }
        } else {
            sendNotification('Nothing to paste, skipping.');
        }
    }

    @bind
    public copyCellAt(index: number, cut: boolean) {
        copy(
            serializeCopyCommand({
                cellId: this.props.dataDoc.cells[index],
                cut,
            })
        );
        sendNotification(
            'Copied.' + (cut ? ' Cell will be moved after paste. ' : '')
        );
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
            onConfirm: () =>
                cloneDataDoc(id).then((dataDoc: IDataDoc) => {
                    sendNotification('Clone Success!');
                    history.push(`/${environment.name}/datadoc/${dataDoc.id}/`);
                }),
        });
    }

    @bind
    @decorate(memoizeOne)
    public _getDataDocContextState(
        isEditable: boolean,
        defaultCollapse: boolean,
        focusedCellIndex: number,
        highlightCellIndex: number,
        cellIdToExecutionId: Record<number, number>
    ): IDataDocContextType {
        return {
            cellIdToExecutionId,
            onQueryCellSelectExecution: (cellId, executionId) => {
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
            },

            insertCellAt: this.insertCellAt,
            updateCell: this.updateCell,
            copyCellAt: this.copyCellAt,
            pasteCellAt: this.pasteCellAt,

            defaultCollapse,
            focusedCellIndex,
            highlightCellIndex,
            cellFocus: {
                onUpKeyPressed: (index: number) => this.focusCellAt(index - 1),
                onDownKeyPressed: (index: number) =>
                    this.focusCellAt(index + 1),
                onFocus: this.onCellFocus,
                onBlur: this.onCellBlur,
            },
            isEditable,
        };
    }

    @bind
    public getDataDocContextState() {
        return this._getDataDocContextState(
            this.props.isEditable,
            this.state.defaultCollapseAllCells,
            this.state.focusedCellIndex,
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

    public onKeyDown = (event: KeyboardEvent) => {
        let stopEvent = false;

        const repeat = event.repeat;

        if (matchKeyPress(event, 'Cmd-S') && !repeat) {
            stopEvent = true;
            this.props.forceSaveDataDoc(this.props.docId);
        }

        if (stopEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
    };

    @bind
    public renderLazyDataDocCell(
        cell: IDataCell,
        index: number,
        numberOfCells: number,
        lastQueryCellId: number,
        queryIndexInDoc: number
    ) {
        const { dataDoc, isEditable } = this.props;

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
                        <DataDocUIGuide hideButton={numberOfCells !== 0} />
                    </div>
                </div>
            );
        } else {
            return (
                <DataDocCell
                    key={cell.id}
                    dataDoc={dataDoc}
                    cell={cell}
                    index={index}
                    queryIndexInDoc={queryIndexInDoc}
                    lastQueryCellId={lastQueryCellId}
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

        const {
            connected,
            defaultCollapseAllCells,

            showSearchAndReplace,
        } = this.state;

        let docDOM = null;
        let isSavingDataDoc = false;

        // This is a hacky way to see if dataDoc is loaded
        // TODO(datahub): make a clean version for loading logic of dataDoc
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
                    <div className="data-doc-container">
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
                defaultCollapse={defaultCollapseAllCells}
                onCollapse={this.handleToggleCollapse}
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
            />
        );

        return (
            <div
                className={classNames({
                    DataDoc: true,
                })}
                key="data-hub-data-doc"
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

    public render() {
        const { dataDoc } = this.props;
        const { errorObj } = this.state;

        if (errorObj) {
            return <DataDocError errorObj={errorObj} />;
        }
        if (!(dataDoc && dataDoc.cells)) {
            return <Loading />;
        }

        return this.renderDataDoc();
    }
}

function mapStateToProps(state: IStoreState, ownProps: IOwnProps) {
    const userInfo = myUserInfoSelector(state);
    const dataDoc = dataDocSelectors.dataDocSelector(state, ownProps);
    const dataDocSavePromise =
        state.dataDoc.dataDocSavePromiseById[ownProps.docId];

    const isEditable = dataDocSelectors.canCurrentUserEditSelector(
        state,
        ownProps
    );
    const userIds = dataDocSelectors.dataDocViewerIdsSelector(state, ownProps);
    const cellIdtoUid = dataDocSelectors.dataDocCursorByCellIdSelector(
        state,
        ownProps
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
        cellIdtoUid,
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: IOwnProps) {
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

        changeDataDocMeta: (docId: number, meta: {}) =>
            dispatch(dataDocActions.updateDataDocField(docId, 'meta', meta)),

        cloneDataDoc: (docId: number) =>
            dispatch(dataDocActions.cloneDataDoc(docId)),

        insertDataDocCell: (
            docId: number,
            index: number,
            cellType: CELL_TYPE,
            context: string | ContentState,
            meta: {}
        ) =>
            dispatch(
                dataDocActions.insertDataDocCell(
                    docId,
                    index,
                    cellType,
                    context,
                    meta
                )
            ),

        updateDataDocCell: (
            docId: number,
            cellId: number,
            fields: DataCellUpdateFields
        ) => {
            try {
                return dispatch(
                    dataDocActions.updateDataDocCell(
                        docId,
                        cellId,
                        fields.context,
                        fields.meta
                    )
                );
            } catch (e) {
                sendNotification(`Cannot update cell, reason: ${e}`);
            }
        },
    };
}

export const DataDoc = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocComponent);
