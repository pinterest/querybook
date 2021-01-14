import classNames from 'classnames';
import * as DraftJs from 'draft-js';
import toast from 'react-hot-toast';
import { debounce, bind } from 'lodash-decorators';
import React from 'react';
import { connect } from 'react-redux';
import Resizable from 're-resizable';

import CodeMirror from 'lib/codemirror';
import {
    getSelectedQuery,
    getQueryAsExplain,
    IRange,
} from 'lib/sql-helper/sql-lexer';
import { renderTemplatedQuery } from 'lib/templated-query';
import { sleep, enableResizable } from 'lib/utils';
import { formatError } from 'lib/utils/error';
import { IDataQueryCellMeta } from 'const/datadoc';

import * as dataSourcesActions from 'redux/dataSources/action';
import { createQueryExecution } from 'redux/queryExecutions/action';
import { setSidebarTableId } from 'redux/querybookUI/action';
import {
    queryEngineSelector,
    queryEngineByIdEnvSelector,
} from 'redux/queryEngine/selector';
import { IStoreState, Dispatch } from 'redux/store/types';

import { DataDocQueryExecutions } from 'components/DataDocQueryExecutions/DataDocQueryExecutions';
import { QueryEditor } from 'components/QueryEditor/QueryEditor';
import { QuerySnippetInsertionModal } from 'components/QuerySnippetInsertionModal/QuerySnippetInsertionModal';
import {
    QueryRunButton,
    IQueryRunButtonHandles,
} from 'components/QueryRunButton/QueryRunButton';
import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';

import { Button } from 'ui/Button/Button';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { ListMenu, IListMenuItem } from 'ui/Menu/ListMenu';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { Title } from 'ui/Title/Title';

import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './DataDocQueryCell.scss';

const ON_CHANGE_DEBOUNCE_MS = 250;

type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
interface IOwnProps {
    query: string;
    meta: IDataQueryCellMeta;
    isEditable: boolean;

    docId: number;
    cellId: number;

    queryIndexInDoc: number;
    templatedVariables: Record<string, string>;

    shouldFocus: boolean;
    isFullScreen: boolean;

    showCollapsed: boolean;

    onChange: (fields: {
        context?: string | DraftJs.ContentState;
        meta?: IDataQueryCellMeta;
    }) => any;
    onFocus?: () => any;
    onBlur?: () => any;
    onUpKeyPressed?: () => any;
    onDownKeyPressed?: () => any;
    onDeleteKeyPressed?: () => any;
    toggleFullScreen: () => any;
}
type IProps = IOwnProps & StateProps & DispatchProps;

interface IState {
    query: string;
    meta: IDataQueryCellMeta;

    focused: boolean;
    selectedRange: {
        from: {
            line: number;
            ch: number;
        };
        to: {
            line: number;
            ch: number;
        };
    };
    queryCollapsedOverride: boolean;
    showQuerySnippetModal: boolean;
}

class DataDocQueryCellComponent extends React.Component<IProps, IState> {
    private queryEditorRef = React.createRef<QueryEditor>();
    private runButtonRef = React.createRef<IQueryRunButtonHandles>();
    private selfRef = React.createRef<HTMLDivElement>();
    private keyMap = {
        'Shift-Enter': this.clickOnRunButton,
        'Shift-Alt-D': this.props.onDeleteKeyPressed,
    };

    public constructor(props) {
        super(props);

        this.state = {
            query: props.query,
            meta: props.meta,
            focused: false,
            selectedRange: null,
            queryCollapsedOverride: null,
            showQuerySnippetModal: false,
        };
    }

    @bind
    public get engineId() {
        return this.state.meta.engine;
    }

    @bind
    @debounce(ON_CHANGE_DEBOUNCE_MS)
    public onChangeDebounced(...args) {
        this.props.onChange.apply(null, args);
    }

    @bind
    public updateFocus() {
        if (this.props.shouldFocus !== this.state.focused) {
            if (!this.state.focused) {
                this.focus();
            }

            this.setState({
                focused: this.props.shouldFocus,
            });
        }
    }

    @bind
    public onSelection(query: string, selectedRange: IRange) {
        this.setState({
            selectedRange,
        });

        // disable this feature for now since users complainted that
        // the sidebar popup disrupts the flow when selecting table names

        // if (selectedRange) {
        //     const codeAnalysis: ICodeAnalysis = this.queryEditorRef.current.getCodeAnalysis();

        //     if (
        //         codeAnalysis &&
        //         codeAnalysis.lineage &&
        //         codeAnalysis.lineage.references &&
        //         selectedRange.from.line === selectedRange.to.line
        //     ) {
        //         const selectionLine = selectedRange.from.line;
        //         const selectionPos = {
        //             from: selectedRange.from.ch,
        //             to: selectedRange.to.ch,
        //         };

        //         const tableReferences = Array.prototype.concat.apply(
        //             [],
        //             Object.values(codeAnalysis.lineage.references)
        //         );
        //         const table = find(tableReferences, (tb) => {
        //             if (tb.line === selectionLine) {
        //                 const isSchemaExplicit =
        //                     tb.end - tb.start > tb.name.length;
        //                 const tablePos = {
        //                     from:
        //                         tb.start +
        //                         (isSchemaExplicit ? tb.schema.length + 1 : 0),
        //                     to: tb.end,
        //                 };

        //                 return (
        //                     tablePos.from === selectionPos.from &&
        //                     tablePos.to === selectionPos.to
        //                 );
        //             }
        //         });
        //         if (table) {
        //             (async () => {
        //                 const tableInfo = await this.fetchDataTableByNameIfNeeded(
        //                     table.schema,
        //                     table.name
        //                 );

        //                 if (tableInfo) {
        //                     this.props.setTableSidebarId(tableInfo.id);
        //                     // TODO: do we keep this logic?
        //                     // this.props.showTableInInspector(tableInfo.id);
        //                 } else {
        //                     this.props.setTableSidebarId(null);
        //                     // this.props.showTableInInspector(null);
        //                 }
        //             })();
        //         }
        //     }
        // }
    }

    @bind
    public onBlur() {
        if (this.state.focused) {
            if (this.props.onBlur) {
                this.props.onBlur();
            }
        }
    }

    @bind
    public onFocus() {
        if (!this.state.focused) {
            if (this.props.onFocus) {
                this.props.onFocus();
            }
        }
    }

    @bind
    public focus() {
        if (
            !(
                this.queryEditorRef.current &&
                this.queryEditorRef.current.getEditor
            )
        ) {
            return;
        }

        const editor = this.queryEditorRef.current.getEditor();
        editor.focus();
    }

    @bind
    public onKeyDown(editor: CodeMirror.Editor, event) {
        const keyUpCode = 38;
        const keyDownCode = 40;

        const doc = editor.getDoc();

        const cursor = doc.getCursor();
        const autocompleteWidgetOpen =
            editor.state.completionActive &&
            editor.state.completionActive.widget;

        let stopEvent = true;
        if (
            this.props.onUpKeyPressed &&
            event.keyCode === keyUpCode &&
            !autocompleteWidgetOpen &&
            cursor.line === 0 &&
            cursor.ch === 0
        ) {
            this.props.onUpKeyPressed();
        } else if (
            this.props.onDownKeyPressed &&
            event.keyCode === keyDownCode &&
            !autocompleteWidgetOpen &&
            cursor.line === doc.lineCount() - 1 &&
            cursor.ch === doc.getLine(doc.lineCount() - 1).length
        ) {
            this.props.onDownKeyPressed();
        } else {
            stopEvent = false;
        }

        if (stopEvent) {
            event.stopPropagation();
            event.preventDefault();
        }
    }

    @bind
    public clickOnRunButton() {
        if (this.runButtonRef.current) {
            // emulate a click
            this.runButtonRef.current.clickRunButton();
        }
    }

    @bind
    public handleChange(query: string) {
        this.setState(
            {
                query,
            },
            () => this.onChangeDebounced({ context: query })
        );
    }

    @bind
    public handleMetaChange<K extends keyof IDataQueryCellMeta>(
        field: K,
        value: IDataQueryCellMeta[K]
    ) {
        const { meta } = this.state;
        const newMeta = {
            ...meta,
            [field]: value,
        };
        this.setState(
            {
                meta: newMeta,
            },
            () => this.onChangeDebounced({ meta: newMeta })
        );
    }

    @bind
    public handleMetaTitleChange(value: string) {
        return this.handleMetaChange('title', value);
    }

    @bind
    public async getCurrentSelectedQuery() {
        const { templatedVariables = {} } = this.props;
        const { query } = this.state;
        const selectedRange =
            this.queryEditorRef.current &&
            this.queryEditorRef.current.getEditorSelection();

        try {
            const rawQuery = getSelectedQuery(query, selectedRange);
            return await renderTemplatedQuery(rawQuery, templatedVariables);
        } catch (e) {
            toast.error(
                <div>
                    <p>Failed to templatize query. </p>
                    <p>{formatError(e)}</p>
                </div>,
                {
                    duration: 5000,
                }
            );
        }
    }

    @bind
    public async onRunButtonClick() {
        await sleep(ON_CHANGE_DEBOUNCE_MS);
        const renderedQuery = await this.getCurrentSelectedQuery();

        if (renderedQuery) {
            return this.props.createQueryExecution(
                renderedQuery,
                this.engineId,
                this.props.cellId
            );
        }
    }

    @bind
    public formatQuery(options = {}) {
        if (this.queryEditorRef.current) {
            this.queryEditorRef.current.formatQuery(options);
        }
    }

    @bind
    public async explainQuery() {
        const renderedQuery = getQueryAsExplain(
            await this.getCurrentSelectedQuery()
        );

        if (renderedQuery) {
            return this.props.createQueryExecution(
                renderedQuery,
                this.engineId,
                this.props.cellId
            );
        }
    }

    @bind
    public toggleQueryCollapsing(forceCollapse: boolean) {
        const { isEditable } = this.props;
        if (isEditable) {
            this.handleMetaChange('query_collapsed', !!forceCollapse);
        } else {
            this.setState({ queryCollapsedOverride: !!forceCollapse });
        }
    }

    @bind
    public get queryCollapsed() {
        const { meta } = this.props;
        const { queryCollapsedOverride } = this.state;

        const isQueryCollapsedSavedValue = !!meta?.query_collapsed;
        return queryCollapsedOverride != null
            ? queryCollapsedOverride
            : isQueryCollapsedSavedValue;
    }

    @bind
    public getAdditionalDropDownButtonDOM() {
        const { isEditable } = this.props;

        const queryCollapsed = this.queryCollapsed;

        const additionalButtons: IListMenuItem[] = [];
        if (isEditable) {
            additionalButtons.push({
                name: 'Format Query (⇧⎇F)',
                onClick: this.formatQuery.bind(this, { case: 'upper' }),
                icon: 'fas fa-file-code',
                items: [
                    {
                        name: 'Format (Uppercase)',
                        onClick: this.formatQuery.bind(this, { case: 'upper' }),
                    },
                    {
                        name: 'Format (Lowercase)',
                        onClick: this.formatQuery.bind(this, { case: 'lower' }),
                    },
                ],
            });
            additionalButtons.push({
                name: 'Explain Query',
                onClick: this.explainQuery,
                icon: 'fas fa-info',
                tooltip: 'Run Query as Explain',
                tooltipPos: 'left',
            });
        }

        additionalButtons.push({
            name: queryCollapsed ? 'Show Query' : 'Hide Query',
            onClick: this.toggleQueryCollapsing.bind(this, !queryCollapsed),
            icon: queryCollapsed ? 'far fa-eye' : 'far fa-eye-slash',
        });

        return additionalButtons.length > 0 ? (
            <Dropdown
                customButtonRenderer={this.additionalDropDownButtonFormatter}
                isRight
            >
                <ListMenu items={additionalButtons} isRight />
            </Dropdown>
        ) : null;
    }

    @bind
    public getTitle() {
        const { meta } = this.props;
        return (meta || ({} as any)).title;
    }

    @bind
    public handleInsertSnippet(query: string) {
        this.handleChange(query);
    }

    @bind
    public toggleInsertQuerySnippetModal() {
        this.setState(({ showQuerySnippetModal }) => ({
            showQuerySnippetModal: !showQuerySnippetModal,
        }));
    }

    @bind
    public fetchDataTableByNameIfNeeded(schema: string, table: string) {
        return this.props.fetchDataTableByNameIfNeeded(
            schema,
            table,
            this.props.queryEngineById[this.engineId].metastore_id
        );
    }

    public componentDidMount() {
        this.updateFocus();
    }

    public componentDidUpdate(prevProps, prevState) {
        this.updateFocus();

        if (
            prevProps.query !== this.props.query ||
            prevProps.meta !== this.props.meta
        ) {
            this.setState({
                ...(prevProps.query !== this.props.query && {
                    query: this.props.query,
                }),
                ...(prevProps.meta !== this.props.meta && {
                    meta: this.props.meta,
                }),
            });
        }
    }

    public additionalDropDownButtonFormatter() {
        return (
            <Icon
                className="additional-dropdown-button flex-center"
                name="more-vertical"
            />
        );
    }

    public get defaultCellTitle() {
        const { queryIndexInDoc } = this.props;
        return queryIndexInDoc == null
            ? 'Untitled'
            : `Query #${queryIndexInDoc + 1}`;
    }
    public get dataCellTitle() {
        const { meta } = this.state;

        return meta.title || this.defaultCellTitle;
    }

    public renderErrorCell(errorMessage: React.ReactChild) {
        return (
            <div className={'DataDocQueryCell'} ref={this.selfRef}>
                <div className="data-doc-query-cell-inner">
                    <Message
                        title={'Invalid Query Cell - Please remove'}
                        message={errorMessage}
                        type="error"
                    />
                </div>
            </div>
        );
    }

    public renderCellHeaderDOM() {
        const {
            queryEngines,
            queryEngineById,

            isEditable,
        } = this.props;
        const { meta, selectedRange } = this.state;

        const queryTitleDOM = isEditable ? (
            <ResizableTextArea
                value={meta.title}
                onChange={this.handleMetaTitleChange}
                transparent
                placeholder={this.defaultCellTitle}
                className="Title"
            />
        ) : (
            <Title size={4}>{this.dataCellTitle}</Title>
        );

        return (
            <div className="query-metadata">
                <div className="query-title">{queryTitleDOM}</div>
                <QueryRunButton
                    ref={this.runButtonRef}
                    queryEngineById={queryEngineById}
                    queryEngines={queryEngines}
                    disabled={!isEditable}
                    hasSelection={selectedRange != null}
                    engineId={this.engineId}
                    onRunClick={this.onRunButtonClick}
                    onEngineIdSelect={this.handleMetaChange.bind(
                        this,
                        'engine'
                    )}
                />
                {this.getAdditionalDropDownButtonDOM()}
            </div>
        );
    }

    public renderEditorDOM() {
        const {
            queryEngineById,
            cellId,
            isEditable,
            isFullScreen,
            toggleFullScreen,
        } = this.props;
        const { query, showQuerySnippetModal } = this.state;
        const queryEngine = queryEngineById[this.engineId];
        const queryCollapsed = this.queryCollapsed;

        const fullScreenButton = (
            <div className="fullscreen-button-wrapper">
                <Button
                    icon="maximize"
                    onClick={toggleFullScreen}
                    borderless
                    transparent
                    pushable
                />
            </div>
        );
        const editorDOM = !queryCollapsed && (
            <div className="editor">
                {fullScreenButton}
                <BoundQueryEditor
                    value={query}
                    lineWrapping={true}
                    onKeyDown={this.onKeyDown}
                    onChange={this.handleChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    onSelection={this.onSelection}
                    readOnly={!isEditable}
                    keyMap={this.keyMap}
                    ref={this.queryEditorRef}
                    engine={queryEngine}
                    cellId={cellId}
                    height={isFullScreen ? 'full' : 'auto'}
                />
            </div>
        );

        const openSnippetDOM =
            query.trim().length === 0 && isEditable ? (
                <div className="add-snippet-wrapper flex-center">
                    <Button
                        title="Add Template"
                        onClick={this.toggleInsertQuerySnippetModal}
                        borderless
                        type="inlineText"
                    />
                </div>
            ) : null;

        const insertQuerySnippetModalDOM = showQuerySnippetModal ? (
            <Modal
                onHide={this.toggleInsertQuerySnippetModal}
                className="wide"
                title="Insert Query Snippet"
            >
                <QuerySnippetInsertionModal
                    onInsert={this.handleInsertSnippet}
                />
            </Modal>
        ) : null;

        return (
            <>
                {editorDOM}
                {openSnippetDOM}
                {insertQuerySnippetModalDOM}
            </>
        );
    }

    public renderExecutionsDOM() {
        const { cellId, docId } = this.props;

        return (
            <DataDocQueryExecutions
                docId={docId}
                cellId={cellId}
                isQueryCollapsed={this.queryCollapsed}
                changeCellContext={this.handleChange}
            />
        );
    }

    public render() {
        const {
            queryEngines,
            queryEngineById,
            showCollapsed,
            isFullScreen,
        } = this.props;
        const { query } = this.state;

        if (!queryEngines.length) {
            return this.renderErrorCell(
                'QueryCell will not work unless there is at least 1 query engine.' +
                    ' Please contact admin.'
            );
        } else if (!(this.engineId in queryEngineById)) {
            return this.renderErrorCell(
                <>
                    <p>
                        Please remove this cell since it uses an invalid engine.
                        Query text:
                    </p>
                    <p>{query}</p>
                </>
            );
        }

        const classes = classNames({
            DataDocQueryCell: true,
            fullScreen: isFullScreen,
        });

        return showCollapsed ? (
            <div className={classes} ref={this.selfRef}>
                <div className="query-title flex-row">
                    <span>{this.dataCellTitle}</span>
                    <span>{'{...}'}</span>
                </div>
            </div>
        ) : isFullScreen ? (
            <div className={classes} ref={this.selfRef}>
                {this.renderCellHeaderDOM()}
                <div className="query-content">
                    {this.renderEditorDOM()}
                    <Resizable
                        defaultSize={{
                            width: '100%',
                            height: `300px`,
                        }}
                        enable={enableResizable({ top: true, bottom: true })}
                        minHeight={200}
                    >
                        {this.renderExecutionsDOM()}
                    </Resizable>
                </div>
            </div>
        ) : (
            <div className={classes} ref={this.selfRef}>
                {this.renderCellHeaderDOM()}
                <div className="query-content">
                    {this.renderEditorDOM()}
                    {this.renderExecutionsDOM()}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: IStoreState, ownProps: IOwnProps) {
    const queryEngines = queryEngineSelector(state);

    return {
        queryEngines,
        queryEngineById: queryEngineByIdEnvSelector(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: IOwnProps) {
    return {
        fetchDataTableByNameIfNeeded: (schemaName, tableName, metastoreId) =>
            dispatch(
                dataSourcesActions.fetchDataTableByNameIfNeeded(
                    schemaName,
                    tableName,
                    metastoreId
                )
            ),
        createQueryExecution: (
            query: string,
            engineId: number,
            cellId: number
        ) => dispatch(createQueryExecution(query, engineId, cellId)),

        setTableSidebarId: (id: number) => dispatch(setSidebarTableId(id)),
    };
}

export const DataDocQueryCell = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocQueryCellComponent);
