import React from 'react';
import { connect } from 'react-redux';
import { ContentState } from 'draft-js';
import { findIndex, sample } from 'lodash';
import { bind, debounce } from 'lodash-decorators';

import { decorate } from 'core-decorators';
import memoizeOne from 'memoize-one';
import classNames from 'classnames';

import { CELL_TYPE, IDataDoc, IDataCell } from 'const/datadoc';
import ds from 'lib/datasource';
import history from 'lib/router-history';
import { sendConfirm, sendNotification } from 'lib/dataHubUI';
import { scrollToCell } from 'lib/data-doc/data-doc-utils';
import { sanitizeUrlTitle } from 'lib/utils';
import { getQueryString } from 'lib/utils/query-string';
import { matchKeyPress } from 'lib/utils/keyboard';

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

import { DataDocLeftSidebar } from 'components/DataDocLeftSidebar/DataDocLeftSidebar';
import { DataDocRightSidebar } from 'components/DataDocRightSidebar/DataDocRightSidebar';
import { DataDocUIGuide } from 'components/UIGuide/DataDocUIGuide';
import { DataDocCell } from 'components/DataDocCell/DataDocCell';

import { Title } from 'ui/Title/Title';
import { Message } from 'ui/Message/Message';
import { Loading } from 'ui/Loading/Loading';

import { DataDocHeader } from './DataDocHeader';
import { DataDocCellControl } from './DataDocCellControl';
import { DataDocError } from './DataDocError';

import './DataDoc.scss';
import { DataDocContentContainer } from './DataDocContentContainer';

const loadingHints: string[] = require('config/loading_hints.yaml').hints;

interface IOwnProps {
    docId: number;
}
type DataDocStateProps = ReturnType<typeof mapStateToProps>;
type DataDocDispatchProps = ReturnType<typeof mapDispatchToProps>;

type IProps = IOwnProps & DataDocStateProps & DataDocDispatchProps;

interface IState {
    fullScreenCellIndex?: number;
    focusedCellIndex?: number;
    errorObj?: React.ReactChild;
    // indicates whether or not datadoc is connected to websocket
    connected: boolean;
    defaultCollapseAllCells: boolean;
}

class DataDocComponent extends React.Component<IProps, IState> {
    public readonly state = {
        fullScreenCellIndex: null,
        errorObj: null,
        focusedCellIndex: null,
        connected: false,
        defaultCollapseAllCells: null,
    };

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
                this.setState({ defaultCollapseAllCells: null });
            }
            this.openDataDoc(this.props.docId);
        }

        if (this.props.dataDoc !== prevProps.dataDoc && this.props.dataDoc) {
            this.publishDataDocTitle(this.props.dataDoc.title);
        }
    }

    // Show data doc title in url and document title
    @decorate(memoizeOne)
    public publishDataDocTitle(title: string) {
        title = title || 'Untitled';
        document.title = title;
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
        this.setState({
            focusedCellIndex: index,
        });
        this.updateDocCursor(index);
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
                        scrollToCell(dataDoc.dataDocCells[cellIndex]);
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
    public async insertCellAt(
        index: number,
        cellType: CELL_TYPE,
        context: string,
        meta: {}
    ) {
        try {
            const dataDoc = this.props.dataDoc;
            if (dataDoc) {
                await this.props.insertDataDocCell(
                    dataDoc.id,
                    index,
                    cellType,
                    context,
                    meta
                );
                this.focusCellAt(index);
            }
        } catch (e) {
            sendNotification(`Insert cell failed, reason: ${e}`);
        }
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
    public fullscreenCellAt(index: number) {
        this.setState({
            fullScreenCellIndex: index,
        });
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
    public runAllQueryCells() {
        ds.save(`/datadoc/${this.props.docId}/run/`);
    }

    public makeDataDocLoadingDOM() {
        // Get a random hint from list of hints
        const hint = sample(loadingHints);

        return (
            <div className="datadoc-loading">
                <div className="datadoc-loading-message">
                    <Title>
                        <i className="fa fa-spinner fa-pulse" />
                        &nbsp; Loading DataDoc
                    </Title>

                    <br />
                    <p className="subtitle">
                        <i className="far fa-lightbulb" />
                        &nbsp; Did you know: {hint}
                    </p>
                </div>
            </div>
        );
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
                            isHeader={false}
                            active={forceShow}
                            isEditable={isEditable}
                        />
                        <DataDocUIGuide hideButton={numberOfCells !== 0} />
                    </div>
                </div>
            );
        } else {
            const cellFocusProps = {
                onUpKeyPressed: this.focusCellAt.bind(this, index - 1),
                onDownKeyPressed: this.focusCellAt.bind(this, index + 1),
                onFocus: this.onCellFocus.bind(this, index),
                onBlur: this.onCellBlur.bind(this, index),
            };
            return (
                <DataDocCell
                    key={cell.id}
                    dataDoc={dataDoc}
                    cell={cell}
                    index={index}
                    queryIndexInDoc={queryIndexInDoc}
                    lastQueryCellId={lastQueryCellId}
                    isEditable={isEditable}
                    focusedCellIndex={this.state.focusedCellIndex}
                    insertCellAt={insertCellAtBinded}
                    cellFocusProps={cellFocusProps}
                    defaultCollapse={this.state.defaultCollapseAllCells}
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
            docDOM = this.makeDataDocLoadingDOM();
        }

        const leftSideBar = (
            <DataDocLeftSidebar
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
                onRunAllQueries={this.runAllQueryCells}
            />
        );

        return (
            <div
                className={classNames({
                    DataDoc: true,
                })}
                key="data-hub-data-doc"
            >
                {leftSideBar}
                {docDOM}
                {rightSideBar}
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
    };
}

export const DataDoc = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocComponent);
