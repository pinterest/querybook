import clsx from 'clsx';
import { decorate } from 'core-decorators';
import * as DraftJs from 'draft-js';
import { bind, debounce } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import Resizable from 're-resizable';
import React from 'react';
import toast from 'react-hot-toast';
import { connect } from 'react-redux';

import { DataDocQueryExecutions } from 'components/DataDocQueryExecutions/DataDocQueryExecutions';
import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { QueryEditor } from 'components/QueryEditor/QueryEditor';
import {
    IQueryRunButtonHandles,
    QueryEngineSelector,
    QueryRunButton,
} from 'components/QueryRunButton/QueryRunButton';
import { QuerySnippetInsertionModal } from 'components/QuerySnippetInsertionModal/QuerySnippetInsertionModal';
import { TemplatedQueryView } from 'components/TemplateQueryView/TemplatedQueryView';
import { UDFForm } from 'components/UDFForm/UDFForm';
import { IDataQueryCellMeta } from 'const/datadoc';
import type { IQueryEngine } from 'const/queryEngine';
import CodeMirror from 'lib/codemirror';
import {
    getQueryAsExplain,
    getSelectedQuery,
    IRange,
} from 'lib/sql-helper/sql-lexer';
import { renderTemplatedQuery } from 'lib/templated-query';
import { enableResizable, sleep } from 'lib/utils';
import { formatError } from 'lib/utils/error';
import { getShortcutSymbols, KeyMap, matchKeyPress } from 'lib/utils/keyboard';
import { doesLanguageSupportUDF } from 'lib/utils/udf';
import * as dataSourcesActions from 'redux/dataSources/action';
import { setSidebarTableId } from 'redux/querybookUI/action';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import { createQueryExecution } from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button, TextButton } from 'ui/Button/Button';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { IListMenuItem, ListMenu } from 'ui/Menu/ListMenu';
import { Modal } from 'ui/Modal/Modal';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { AccentText } from 'ui/StyledText/StyledText';

import { ISelectedRange } from './common';
import { ErrorQueryCell } from './ErrorQueryCell';

import './DataDocQueryCell.scss';

const ON_CHANGE_DEBOUNCE_MS = 500;
const FORMAT_QUERY_SHORTCUT = getShortcutSymbols(
    KeyMap.queryEditor.formatQuery.key
);

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
    selectedRange: ISelectedRange;
    queryCollapsedOverride: boolean;
    showQuerySnippetModal: boolean;
    showRenderedTemplateModal: boolean;
    showUDFModal: boolean;
}

class DataDocQueryCellComponent extends React.PureComponent<IProps, IState> {
    private queryEditorRef = React.createRef<QueryEditor>();
    private runButtonRef = React.createRef<IQueryRunButtonHandles>();

    public constructor(props) {
        super(props);

        this.state = {
            query: props.query,
            meta: props.meta,
            focused: false,
            selectedRange: null,
            queryCollapsedOverride: null,
            showQuerySnippetModal: false,
            showRenderedTemplateModal: false,
            showUDFModal: false,
        };
    }

    @bind public get keyMap() {
        return this._keyMapMemo(this.props.queryEngines);
    }

    @bind
    public get engineId() {
        return this.state.meta.engine;
    }

    @bind
    public get queryEngine() {
        return this.props.queryEngineById[this.engineId];
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

    public get hasUDFSupport() {
        const queryEngine = this.queryEngine;
        if (!queryEngine) {
            return false;
        }
        return doesLanguageSupportUDF(queryEngine.language);
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

    @decorate(memoizeOne)
    public _keyMapMemo(engines: IQueryEngine[]) {
        const keyMap = {
            [KeyMap.queryEditor.runQuery.key]: this.clickOnRunButton,
            [KeyMap.queryEditor.deleteCell.key]: this.props.onDeleteKeyPressed,
        };

        for (const [index, engine] of engines.entries()) {
            const key = index + 1;
            if (key > 9) {
                // We have exhausted all number keys on the keyboard
                break;
            }

            keyMap[KeyMap.queryEditor.changeEngine.key + '-' + String(key)] =
                () => this.handleMetaChange('engine', engine.id);
        }

        return keyMap;
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
    public onKeyDown(editor: CodeMirror.Editor, event: KeyboardEvent) {
        const doc = editor.getDoc();

        const cursor = doc.getCursor();
        const autocompleteWidgetOpen =
            editor.state.completionActive &&
            editor.state.completionActive.widget;

        let stopEvent = true;
        if (
            this.props.onUpKeyPressed &&
            !autocompleteWidgetOpen &&
            cursor.line === 0 &&
            cursor.ch === 0 &&
            matchKeyPress(event, 'up')
        ) {
            this.props.onUpKeyPressed();
        } else if (
            this.props.onDownKeyPressed &&
            !autocompleteWidgetOpen &&
            cursor.line === doc.lineCount() - 1 &&
            cursor.ch === doc.getLine(doc.lineCount() - 1).length &&
            matchKeyPress(event, 'down')
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
            return await renderTemplatedQuery(
                rawQuery,
                templatedVariables,
                this.engineId
            );
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
    public handleRunFromRenderedTemplateModal() {
        this.toggleShowRenderedTemplateModal();
        this.clickOnRunButton();
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
    public getAdditionalDropDownButtonDOM() {
        const { isEditable } = this.props;

        const queryCollapsed = this.queryCollapsed;

        const additionalButtons: IListMenuItem[] = [];
        if (isEditable) {
            additionalButtons.push({
                name: `Format Query (${FORMAT_QUERY_SHORTCUT})`,
                onClick: this.formatQuery.bind(this, { case: 'upper' }),
                icon: 'Edit',
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
                icon: 'Info',
                tooltip: 'Run query as explain',
                tooltipPos: 'left',
            });
        }

        additionalButtons.push({
            name: 'Render template',
            onClick: this.toggleShowRenderedTemplateModal,
            icon: 'Code',
            tooltip: 'Show the rendered templated query',
            tooltipPos: 'left',
        });

        additionalButtons.push({
            name: queryCollapsed ? 'Show Query' : 'Hide Query',
            onClick: this.toggleQueryCollapsing.bind(this, !queryCollapsed),
            icon: queryCollapsed ? 'Eye' : 'EyeOff',
        });

        if (this.hasUDFSupport) {
            additionalButtons.push({
                name: 'Add UDF',
                onClick: () => this.setState({ showUDFModal: true }),
                icon: 'Plus',
            });
        }

        return additionalButtons.length > 0 ? (
            <Dropdown
                className="query-cell-additional-dropdown"
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
        this.toggleInsertQuerySnippetModal();
    }

    @bind
    public toggleInsertQuerySnippetModal() {
        this.setState(({ showQuerySnippetModal }) => ({
            showQuerySnippetModal: !showQuerySnippetModal,
        }));
    }

    @bind
    public toggleShowRenderedTemplateModal() {
        this.setState(({ showRenderedTemplateModal }) => ({
            showRenderedTemplateModal: !showRenderedTemplateModal,
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
                name="MoreVertical"
                color="light"
            />
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
            <span className="p8">{this.dataCellTitle}</span>
        );

        return (
            <div className="query-metadata">
                <AccentText className="query-title" weight="bold" size="large">
                    {queryTitleDOM}
                </AccentText>
                <div className="query-controls flex-row">
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
            templatedVariables,
        } = this.props;
        const {
            query,
            showQuerySnippetModal,
            showRenderedTemplateModal,
            showUDFModal,
        } = this.state;
        const queryEngine = queryEngineById[this.engineId];
        const queryCollapsed = this.queryCollapsed;

        const fullScreenButton = (
            <div className="fullscreen-button-wrapper mt4">
                <Button
                    icon={isFullScreen ? 'Minimize2' : 'Maximize2'}
                    onClick={toggleFullScreen}
                    theme="text"
                    pushable
                />
            </div>
        );
        const openSnippetDOM =
            query.trim().length === 0 && isEditable ? (
                <div className="add-snippet-wrapper">
                    <TextButton
                        title="Add Snippet"
                        onClick={this.toggleInsertQuerySnippetModal}
                    />
                </div>
            ) : null;

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
                    allowFullScreen={false}
                />
                {openSnippetDOM}
            </div>
        );

        const insertQuerySnippetModalDOM = showQuerySnippetModal ? (
            <QuerySnippetInsertionModal
                onInsert={this.handleInsertSnippet}
                onHide={this.toggleInsertQuerySnippetModal}
            />
        ) : null;

        const templatedQueryViewModalDOM = showRenderedTemplateModal ? (
            <Modal
                onHide={this.toggleShowRenderedTemplateModal}
                title="Rendered Templated Query"
            >
                <TemplatedQueryView
                    query={query}
                    templatedVariables={templatedVariables}
                    engineId={this.engineId}
                    onRunQueryClick={this.handleRunFromRenderedTemplateModal}
                />
            </Modal>
        ) : null;

        const UDFModal = showUDFModal ? (
            <Modal
                title="Insert User Defined Function"
                onHide={() => this.setState({ showUDFModal: false })}
            >
                <UDFForm
                    onConfirm={(udfScript) => {
                        this.handleChange(udfScript + '\n\n' + query);
                        this.setState({ showUDFModal: false });
                        toast('UDF Added!');
                    }}
                    engineLanguage={this.queryEngine.language}
                />
            </Modal>
        ) : null;

        return (
            <>
                {editorDOM}
                {insertQuerySnippetModalDOM}
                {templatedQueryViewModalDOM}
                {UDFModal}
            </>
        );
    }

    public renderExecutionsDOM() {
        const { cellId, docId, isEditable } = this.props;

        return (
            <DataDocQueryExecutions
                docId={docId}
                cellId={cellId}
                isQueryCollapsed={this.queryCollapsed}
                changeCellContext={isEditable ? this.handleChange : null}
            />
        );
    }

    public renderNoEngineCell() {
        const errorMessage =
            'QueryCell will not work unless there is at least 1 query engine.' +
            ' Please contact admin.';
        return <ErrorQueryCell errorMessage={errorMessage} />;
    }

    public renderInvalidEngineCell() {
        const { showCollapsed, isEditable, queryEngineById, queryEngines } =
            this.props;
        const { query } = this.state;
        const errorMessage = isEditable
            ? 'Please choose another engine for this cell since it uses an invalid engine.'
            : 'This query cell uses an invalid engine.';
        const queryEnginePicker = isEditable ? (
            <QueryEngineSelector
                queryEngineById={queryEngineById}
                queryEngines={queryEngines}
                engineId={this.engineId}
                onEngineIdSelect={this.handleMetaChange.bind(this, 'engine')}
            />
        ) : null;

        return (
            <ErrorQueryCell
                errorMessage={errorMessage}
                collapsed={showCollapsed}
            >
                <div className="right-align ph4 mv8">{queryEnginePicker}</div>

                <ThemedCodeHighlight height="" value={query} />
                {this.renderExecutionsDOM()}
            </ErrorQueryCell>
        );
    }

    public render() {
        const { queryEngines, queryEngineById, showCollapsed, isFullScreen } =
            this.props;

        if (!queryEngines.length) {
            return this.renderNoEngineCell();
        } else if (!(this.engineId in queryEngineById)) {
            return this.renderInvalidEngineCell();
        }

        const classes = clsx({
            DataDocQueryCell: true,
            fullScreen: isFullScreen,
        });

        return showCollapsed ? (
            <div className={classes}>
                <div className="collapsed-query flex-row">
                    <Icon name="Terminal" className="mt4 mr8" />
                    <AccentText className="one-line-ellipsis pr16">
                        {this.dataCellTitle}
                    </AccentText>
                </div>
            </div>
        ) : isFullScreen ? (
            <div className={classes}>
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
            <div className={classes}>
                {this.renderCellHeaderDOM()}
                <div className="query-content">
                    {this.renderEditorDOM()}
                    {this.renderExecutionsDOM()}
                </div>
            </div>
        );
    }
}

function mapStateToProps(state: IStoreState) {
    const queryEngines = queryEngineSelector(state);

    return {
        queryEngines,
        queryEngineById: queryEngineByIdEnvSelector(state),
    };
}

function mapDispatchToProps(dispatch: Dispatch) {
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
