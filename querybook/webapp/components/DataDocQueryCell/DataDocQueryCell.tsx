import clsx from 'clsx';
import { decorate } from 'core-decorators';
import * as DraftJs from 'draft-js';
import { bind, debounce } from 'lodash-decorators';
import memoizeOne from 'memoize-one';
import Resizable from 're-resizable';
import React from 'react';
import toast from 'react-hot-toast';
import { connect } from 'react-redux';

import { AICommandBar } from 'components/AIAssistant/AICommandBar';
import { DataDocQueryExecutions } from 'components/DataDocQueryExecutions/DataDocQueryExecutions';
import { DataDocTableSamplingInfo } from 'components/DataDocTableSamplingInfo/DataDocTableSamplingInfo';
import { QueryCellTitle } from 'components/QueryCellTitle/QueryCellTitle';
import { runQuery, transformQuery } from 'components/QueryComposer/RunQuery';
import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { IQueryEditorHandles } from 'components/QueryEditor/QueryEditor';
import {
    IQueryRunButtonHandles,
    QueryEngineSelector,
    QueryRunButton,
} from 'components/QueryRunButton/QueryRunButton';
import { QuerySnippetInsertionModal } from 'components/QuerySnippetInsertionModal/QuerySnippetInsertionModal';
import { TemplatedQueryView } from 'components/TemplateQueryView/TemplatedQueryView';
import { TranspileQueryModal } from 'components/TranspileQueryModal/TranspileQueryModal';
import { UDFForm } from 'components/UDFForm/UDFForm';
import PublicConfig from 'config/querybook_public_config.yaml';
import { ComponentType, ElementType } from 'const/analytics';
import {
    IDataQueryCellMeta,
    ISamplingTables,
    TDataDocMetaVariables,
} from 'const/datadoc';
import { IDataTable } from 'const/metastore';
import type { IQueryEngine, IQueryTranspiler } from 'const/queryEngine';
import { SurveySurfaceType } from 'const/survey';
import { triggerSurvey } from 'hooks/ui/useSurveyTrigger';
import { trackClick } from 'lib/analytics';
import CodeMirror from 'lib/codemirror';
import { createSQLLinter } from 'lib/codemirror/codemirror-lint';
import {
    getQueryAsExplain,
    getSelectedQuery,
    IRange,
} from 'lib/sql-helper/sql-lexer';
import { DEFAULT_ROW_LIMIT } from 'lib/sql-helper/sql-limiter';
import { getPossibleTranspilers } from 'lib/templated-query/transpile';
import { enableResizable } from 'lib/utils';
import { getShortcutSymbols, KeyMap, matchKeyPress } from 'lib/utils/keyboard';
import { doesLanguageSupportUDF } from 'lib/utils/udf';
import * as dataDocActions from 'redux/dataDoc/action';
import * as dataSourcesActions from 'redux/dataSources/action';
import { setSidebarTableId } from 'redux/querybookUI/action';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import { createQueryExecution } from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { TextButton } from 'ui/Button/Button';
import { ThemedCodeHighlight } from 'ui/CodeHighlight/ThemedCodeHighlight';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { Icon } from 'ui/Icon/Icon';
import { IListMenuItem, ListMenu } from 'ui/Menu/ListMenu';
import { Modal } from 'ui/Modal/Modal';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';
import { AccentText } from 'ui/StyledText/StyledText';

import { ISelectedRange } from './common';
import { ErrorQueryCell } from './ErrorQueryCell';

import './DataDocQueryCell.scss';

const AIAssistantConfig = PublicConfig.ai_assistant;

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
    templatedVariables: TDataDocMetaVariables;

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
    toggleFullScreen: () => any;
}
type IProps = IOwnProps & StateProps & DispatchProps;

interface IState {
    query: string;
    meta: IDataQueryCellMeta;

    modifiedAt: number;
    focused: boolean;
    selectedRange: ISelectedRange;
    queryCollapsedOverride: boolean;
    showQuerySnippetModal: boolean;
    showRenderedTemplateModal: boolean;
    showUDFModal: boolean;
    hasLintError: boolean;
    tableNamesInQuery: string[];
    samplingTables: ISamplingTables;
    showTableSamplingInfoModal: boolean;

    transpilerConfig?: {
        toEngine: IQueryEngine;
        transpilerName: string;
    };
}

class DataDocQueryCellComponent extends React.PureComponent<IProps, IState> {
    private queryEditorRef = React.createRef<IQueryEditorHandles>();
    private runButtonRef = React.createRef<IQueryRunButtonHandles>();
    private commandInputRef = React.createRef<IResizableTextareaHandles>();

    public constructor(props) {
        super(props);

        this.state = {
            query: props.query,
            meta: props.meta,
            modifiedAt: 0,
            focused: false,
            selectedRange: null,
            queryCollapsedOverride: null,
            showQuerySnippetModal: false,
            showRenderedTemplateModal: false,
            showUDFModal: false,
            hasLintError: false,
            tableNamesInQuery: [],
            samplingTables: {},
            showTableSamplingInfoModal: false,
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
    public get hasQueryValidators() {
        return Boolean(this.queryEngine.feature_params?.validator);
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

    public get hasRowLimit() {
        return !!this.queryEngine.feature_params.row_limit;
    }

    public get rowLimit() {
        return this.state.meta.limit ?? DEFAULT_ROW_LIMIT;
    }

    public get samplingTables() {
        const samplingTables = this.state.samplingTables;
        Object.keys(samplingTables).forEach((tableName) => {
            samplingTables[tableName].sample_rate = this.sampleRate;
        });
        return samplingTables;
    }

    public get hasSamplingTables() {
        return Object.keys(this.state.samplingTables).length > 0;
    }

    public get sampleRate() {
        // -1 for tables don't support sampling, 0 for default sample rate (which means disable sampling)
        return this.hasSamplingTables ? this.state.meta.sample_rate ?? 0 : -1;
    }

    @decorate(memoizeOne)
    public _keyMapMemo(engines: IQueryEngine[]) {
        const keyMap = {
            [KeyMap.queryEditor.runQuery.key]: this.clickOnRunButton,
            [KeyMap.queryEditor.focusCommandInput.key]: this.focusCommandInput,
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

    @decorate(memoizeOne)
    public getTranspilerOptions(
        transpilers: IQueryTranspiler[],
        queryEngine: IQueryEngine,
        queryEngines: IQueryEngine[]
    ) {
        return getPossibleTranspilers(transpilers, queryEngine, queryEngines);
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
    public onLintCompletion(hasError: boolean) {
        this.setState({
            hasLintError: hasError,
        });
    }

    @decorate(memoizeOne)
    public createGetLintAnnotations(
        engineId: number,
        templatedVariables: TDataDocMetaVariables
    ) {
        return createSQLLinter(engineId, templatedVariables);
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
    public focusCommandInput() {
        this.commandInputRef.current?.focus();
    }

    @bind
    public handleChange(query: string, run: boolean = false) {
        this.setState(
            {
                query,
                modifiedAt: Date.now(),
            },
            () => {
                this.onChangeDebounced({ context: query });
                if (run) {
                    this.clickOnRunButton();
                }
            }
        );
    }

    @bind
    public async forceSaveQuery() {
        this.props.onChange({ context: this.state.query });
        await this.props.forceSaveDataCell(this.props.cellId);
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
    public handleMetaRowLimitChange(limit: number) {
        return this.handleMetaChange('limit', limit);
    }

    @bind
    public handleMetaSampleRateChange(sampleRate: number) {
        return this.handleMetaChange('sample_rate', sampleRate);
    }

    @bind
    public async getTransformedQuery() {
        const { templatedVariables = [] } = this.props;
        const { query } = this.state;
        const selectedRange =
            this.queryEditorRef.current &&
            this.queryEditorRef.current.getEditorSelection();
        const rawQuery = getSelectedQuery(query, selectedRange);

        return transformQuery(
            rawQuery,
            this.queryEngine.language,
            templatedVariables,
            this.queryEngine,
            this.rowLimit,
            this.samplingTables,
            this.sampleRate
        );
    }

    @bind
    public getQueryExecutionMetadata() {
        const metadata = {};
        if (this.sampleRate > 0) {
            metadata['sample_rate'] = this.sampleRate;
        }
        return Object.keys(metadata).length === 0 ? null : metadata;
    }

    @bind
    public async onRunButtonClick() {
        trackClick({
            component: ComponentType.DATADOC_QUERY_CELL,
            element: ElementType.RUN_QUERY_BUTTON,
            aux: {
                lintError: this.state.hasLintError,
                sampleRate: this.sampleRate,
            },
        });

        return runQuery(
            await this.getTransformedQuery(),
            this.engineId,
            async (query, engineId) => {
                const queryId = (
                    await this.props.createQueryExecution(
                        query,
                        engineId,
                        this.props.cellId,
                        this.getQueryExecutionMetadata()
                    )
                ).id;

                // Only trigger survey if the query is modified within 5 minutes
                if (Date.now() - this.state.modifiedAt < 5 * 60 * 1000) {
                    triggerSurvey(SurveySurfaceType.QUERY_AUTHORING, {
                        query_execution_id: queryId,
                        cell_id: this.props.cellId,
                    });
                }

                return queryId;
            }
        );
    }

    @bind
    public formatQuery(options = {}) {
        trackClick({
            component: ComponentType.DATADOC_QUERY_CELL,
            element: ElementType.FORMAT_BUTTON,
            aux: options,
        });
        if (this.queryEditorRef.current) {
            this.queryEditorRef.current.formatQuery(options);
        }
    }

    @bind
    public startQueryTranspile(transpilerName: string, toEngine: IQueryEngine) {
        this.setState({ transpilerConfig: { transpilerName, toEngine } });
    }

    @bind
    public clearQueryTranspile() {
        this.setState({ transpilerConfig: null });
    }

    @bind
    public handleTranspileQuery(query: string, engine: IQueryEngine) {
        const updatedMeta = {
            ...this.state.meta,
            engine: engine.id,
        };
        this.clearQueryTranspile();
        this.setState(
            {
                query,
                meta: updatedMeta,
            },
            () => {
                this.onChangeDebounced({
                    context: query,
                    meta: updatedMeta,
                });
                toast.success(`Query transpiled to ${engine.name}`);
            }
        );
    }

    @bind
    public async explainQuery() {
        const renderedQuery = getQueryAsExplain(
            await this.getTransformedQuery()
        );

        if (renderedQuery) {
            const executionMetadata =
                this.sampleRate > 0 ? { sample_rate: this.sampleRate } : null;

            return this.props.createQueryExecution(
                renderedQuery,
                this.engineId,
                this.props.cellId,
                executionMetadata
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
        const { isEditable, queryEngines, queryTranspilers } = this.props;
        const queryEngine = this.queryEngine;

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

        if (isEditable) {
            const transpilerOptions = this.getTranspilerOptions(
                queryTranspilers,
                queryEngine,
                queryEngines
            );
            if (transpilerOptions.length > 0) {
                additionalButtons.push({
                    name: `Transpile Query`,
                    icon: 'Languages',

                    items: transpilerOptions.map((t) => ({
                        name: `To ${t.toEngine.name} (${t.toEngine.language})`,
                        onClick: () =>
                            this.startQueryTranspile(
                                t.transpilerName,
                                t.toEngine
                            ),
                    })),
                });
            }
        }

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
                layout={['bottom', 'right']}
            >
                <ListMenu items={additionalButtons} />
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

        trackClick({
            component: ComponentType.DATADOC_QUERY_CELL,
            element: ElementType.INSERT_SNIPPET_BUTTON,
        });
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
    public toggleShowTableSamplingInfoModal() {
        this.setState(({ showTableSamplingInfoModal }) => ({
            showTableSamplingInfoModal: !showTableSamplingInfoModal,
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

    @bind
    public handleTablesChange(tablesByName: Record<string, IDataTable>) {
        const samplingTables = {};
        Object.keys(tablesByName).forEach((tableName) => {
            const table = tablesByName[tableName];
            if (table?.custom_properties?.sampling) {
                samplingTables[tableName] = {
                    sampled_table: table.custom_properties?.sampled_table,
                };
            }
        });
        this.setState({
            samplingTables,
            tableNamesInQuery: Object.keys(tablesByName),
        });
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
            docId,
            cellId,
            queryEngines,
            queryEngineById,

            isEditable,
        } = this.props;
        const { meta, query, selectedRange } = this.state;

        const queryTitleDOM = isEditable ? (
            <QueryCellTitle
                cellId={cellId}
                value={meta.title}
                onChange={this.handleMetaTitleChange}
                placeholder={this.defaultCellTitle}
                query={query}
                forceSaveQuery={this.forceSaveQuery}
            />
        ) : (
            <span className="p8">{this.dataCellTitle}</span>
        );

        return (
            <>
                <div className="query-metadata">
                    <AccentText
                        className="query-title"
                        weight="bold"
                        size="large"
                    >
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
                            rowLimit={this.rowLimit}
                            onRowLimitChange={
                                this.hasRowLimit
                                    ? this.handleMetaRowLimitChange
                                    : null
                            }
                            hasSamplingTables={this.hasSamplingTables}
                            sampleRate={this.sampleRate}
                            onSampleRateChange={
                                this.hasSamplingTables
                                    ? this.handleMetaSampleRateChange
                                    : null
                            }
                            onTableSamplingInfoClick={
                                this.toggleShowTableSamplingInfoModal
                            }
                        />
                        {this.getAdditionalDropDownButtonDOM()}
                    </div>
                </div>
                {AIAssistantConfig.enabled && isEditable && (
                    <AICommandBar
                        query={query}
                        queryEngine={queryEngineById[this.engineId]}
                        tablesInQuery={this.state.tableNamesInQuery}
                        onUpdateQuery={this.handleChange}
                        onUpdateEngineId={this.handleMetaChange.bind(
                            this,
                            'engine'
                        )}
                        onFormatQuery={this.formatQuery.bind(this, {
                            case: 'upper',
                        })}
                        ref={this.commandInputRef}
                    />
                )}
            </>
        );
    }

    public renderEditorDOM() {
        const {
            queryEngineById,
            cellId,
            isEditable,
            isFullScreen,
            templatedVariables,
        } = this.props;
        const {
            query,
            showQuerySnippetModal,
            showRenderedTemplateModal,
            showUDFModal,
            transpilerConfig,
        } = this.state;
        const queryEngine = queryEngineById[this.engineId];
        const queryCollapsed = this.queryCollapsed;

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
                <BoundQueryEditor
                    value={query}
                    lineWrapping={true}
                    onKeyDown={this.onKeyDown}
                    onChange={this.handleChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                    onSelection={this.onSelection}
                    onTablesChange={this.handleTablesChange}
                    readOnly={!isEditable}
                    keyMap={this.keyMap}
                    ref={this.queryEditorRef}
                    engine={queryEngine}
                    cellId={cellId}
                    height={isFullScreen ? 'full' : 'auto'}
                    onFullScreen={this.props.toggleFullScreen}
                    getLintErrors={
                        this.hasQueryValidators
                            ? this.createGetLintAnnotations(
                                  this.engineId,
                                  this.props.templatedVariables
                              )
                            : null
                    }
                    onLintCompletion={this.onLintCompletion}
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
                    hasValidator={this.hasQueryValidators}
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

        const transpilerModal = transpilerConfig ? (
            <TranspileQueryModal
                query={query}
                fromEngine={this.queryEngine}
                toEngine={transpilerConfig.toEngine}
                onHide={this.clearQueryTranspile}
                onTranspileConfirm={this.handleTranspileQuery}
                transpilerName={transpilerConfig.transpilerName}
            />
        ) : null;

        const renderTableSamplingInfoDOM = this.state
            .showTableSamplingInfoModal && (
            <DataDocTableSamplingInfo
                query={this.state.query}
                language={this.queryEngine.language}
                samplingTables={this.samplingTables}
                onHide={this.toggleShowTableSamplingInfoModal}
            />
        );

        return (
            <>
                {editorDOM}
                {insertQuerySnippetModalDOM}
                {templatedQueryViewModalDOM}
                {UDFModal}
                {transpilerModal}
                {renderTableSamplingInfoDOM}
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
                onSamplingInfoClick={this.toggleShowTableSamplingInfoModal}
                hasSamplingTables={this.hasSamplingTables}
                sampleRate={this.sampleRate}
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
        queryTranspilers: state.queryEngine.queryTranspilers,
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
            cellId: number,
            metadata: Record<string, string | number>
        ) => dispatch(createQueryExecution(query, engineId, cellId, metadata)),

        setTableSidebarId: (id: number) => dispatch(setSidebarTableId(id)),

        forceSaveDataCell: (cellId: number) =>
            dispatch(dataDocActions.forceSaveDataDocCell(cellId)),
    };
}

export const DataDocQueryCell = connect(
    mapStateToProps,
    mapDispatchToProps
)(DataDocQueryCellComponent);
