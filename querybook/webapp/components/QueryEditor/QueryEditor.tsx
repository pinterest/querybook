import clsx from 'clsx';
import { decorate } from 'core-decorators';
import { find } from 'lodash';
import { debounce, throttle, bind } from 'lodash-decorators';
import React from 'react';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';
import memoizeOne from 'memoize-one';

import KeyMap from 'const/keyMap';
import CodeMirror, { CodeMirrorKeyMap } from 'lib/codemirror';

import {
    ExcludedTriggerKeys,
    SqlAutoCompleter,
    AutoCompleteType,
} from 'lib/sql-helper/sql-autocompleter';
import {
    ICodeAnalysis,
    TableToken,
    IRange,
    IToken,
} from 'lib/sql-helper/sql-lexer';
import { format } from 'lib/sql-helper/sql-formatter';
import { analyzeCode, getSqlLintAnnotations } from 'lib/web-worker';
import { navigateWithinEnv } from 'lib/utils/query-string';

import { FunctionDocumentationCollection } from 'const/metastore';
import { ICodeMirrorTooltipProps } from 'components/CodeMirrorTooltip/CodeMirrorTooltip';
import { showTooltipFor } from 'components/CodeMirrorTooltip';

import {
    StyledQueryEditor,
    IStyledQueryEditorProps,
} from './StyledQueryEditor';
import './QueryEditor.scss';
import { Button } from 'ui/Button/Button';

// Checks if token is in table, returns the table if found, false otherwise
async function isTokenInTable(
    pos: CodeMirror.Position,
    token: CodeMirror.Token,
    codeAnalysis: ICodeAnalysis,
    getTableByName: (schema: string, name: string) => any
) {
    if (codeAnalysis && token && getTableByName) {
        const selectionLine = pos.line;
        const selectionPos = {
            from: token.start,
            to: token.end,
        };

        const tableReferences: TableToken[] = [].concat.apply(
            [],
            Object.values(codeAnalysis.lineage.references)
        );

        let tablePosFound = null;
        const table = find(tableReferences, (tableInfo) => {
            if (tableInfo.line === selectionLine) {
                const isSchemaExplicit =
                    tableInfo.end - tableInfo.start > tableInfo.name.length;
                const tablePos = {
                    from:
                        tableInfo.start +
                        (isSchemaExplicit ? tableInfo.schema.length : 0),
                    to: tableInfo.end,
                };

                if (
                    tablePos.from <= selectionPos.from &&
                    tablePos.to >= selectionPos.to
                ) {
                    tablePosFound = tablePos;
                    return true;
                }
            }
        });

        if (table) {
            const tableInfo = await getTableByName(table.schema, table.name);
            return {
                tableInfo,
                tablePosFound,
            };
        }
    }

    return false;
}

export interface IQueryEditorProps extends IStyledQueryEditorProps {
    options?: Record<string, unknown>;
    value?: string;

    lineWrapping?: boolean;
    readOnly?: boolean;
    language?: string;
    theme?: string;
    functionDocumentationByNameByLanguage?: FunctionDocumentationCollection;
    metastoreId?: number;
    keyMap?: CodeMirrorKeyMap;
    className?: string;
    autoCompleteType?: AutoCompleteType;
    allowFullScreen?: boolean;

    onChange?: (value: string) => any;
    onKeyDown?: (editor: CodeMirror.Editor, event: KeyboardEvent) => any;
    onFocus?: (editor: CodeMirror.Editor, event: React.SyntheticEvent) => any;
    onBlur?: (editor: CodeMirror.Editor, event: React.SyntheticEvent) => any;
    onSelection?: (str: string, selection: IRange) => any;
    getTableByName?: (schema: string, name: string) => any;
}

interface IState {
    options: Record<string, unknown>;
    fullScreen: boolean;
    lintingOn: boolean;
}

export class QueryEditor extends React.PureComponent<
    IQueryEditorProps,
    IState
> {
    public static defaultProps: Partial<IQueryEditorProps> = {
        options: {},
        keyMap: {},
        value: '',
        lineWrapping: false,
        height: 'auto',
        theme: 'default',
        functionDocumentationByNameByLanguage: {},
        language: 'hive',
        autoCompleteType: 'all',

        allowFullScreen: false,
    };

    private marker = null;
    private codeAnalysis: ICodeAnalysis = null;
    private editor: CodeMirror.Editor = null;
    private autocomplete: SqlAutoCompleter = null;

    public constructor(props) {
        super(props);

        this.state = {
            options: this.createOptions(),
            lintingOn: false,
            fullScreen: false,
        };
    }

    @bind
    public createOptions() {
        const {
            options,
            lineWrapping,
            readOnly,
            theme,
            keyMap,
            language,
            metastoreId,
        } = this.props;
        // In constructor this.state is not defined
        const { lintingOn = false } = this.state || {};
        return this._createOptions(
            options,
            lineWrapping,
            readOnly,
            theme,
            language,
            metastoreId,
            keyMap,
            lintingOn
        );
    }

    @decorate(memoizeOne)
    public _createOptions(
        propsOptions: Record<string, unknown>,
        lineWrapping: boolean,
        readOnly: boolean,
        theme: string,
        language: string,
        metastoreId: number,
        keyMap: CodeMirrorKeyMap,
        lintingOn: boolean
    ) {
        const lintingOptions =
            lintingOn && language != null && metastoreId != null
                ? {
                      lint: metastoreId
                          ? {
                                // Lint only when you can edit
                                getAnnotations: getSqlLintAnnotations(
                                    metastoreId,
                                    language
                                ),
                                async: true,
                                delay: 1000,
                            }
                          : null,
                  }
                : {};

        const options = {
            // lineNumbers: true,
            // mode: 'python',
            mode: 'text/x-hive', // Temporarily hardcoded
            indentWithTabs: true,
            lineWrapping,
            lineNumbers: true,
            gutters: ['CodeMirror-lint-markers'],
            extraKeys: {
                [KeyMap.queryEditor.autocomplete.key]: 'autocomplete',
                [KeyMap.queryEditor.indentLess.key]: 'indentLess',
                [KeyMap.queryEditor.toggleComment.key]: 'toggleComment',
                [KeyMap.queryEditor.openTable.key]: this.onOpenTableModal,
                [KeyMap.queryEditor.formatQuery.key]: this.formatQuery,
                ...keyMap,
            },
            indentUnit: 4,
            textHover: this.onTextHover,
            theme,
            matchBrackets: true,
            autoCloseBrackets: true,
            highlightSelectionMatches: true,

            // Readonly related options
            readOnly,
            cursorBlinkRate: readOnly ? -1 : 530,

            // viewportMargin: Infinity,
            ...lintingOptions,
            ...propsOptions,
        };

        return options;
    }

    @bind
    public makeAutocompleter() {
        this._makeAutocompleter(
            this.props.language,
            this.props.metastoreId,
            this.props.autoCompleteType
        );
    }

    @decorate(memoizeOne)
    public _makeAutocompleter(
        language: string,
        metastoreId: number,
        type: AutoCompleteType
    ) {
        if (language != null) {
            // Update the height
            this.autocomplete = new SqlAutoCompleter(
                CodeMirror,
                language,
                metastoreId,
                type
            );
        }
    }

    @bind
    public matchFunctionWithDefinition(functionName: string) {
        const { functionDocumentationByNameByLanguage, language } = this.props;

        if (language && language in functionDocumentationByNameByLanguage) {
            const functionDefs =
                functionDocumentationByNameByLanguage[language];
            const functionNameLower = (functionName || '').toLowerCase();

            if (functionNameLower in functionDefs) {
                return functionDefs[functionNameLower];
            }
        }

        return null;
    }

    @bind
    public markTextAndShowTooltip(
        editor: CodeMirror.Editor,
        pos: CodeMirror.Position,
        token: IToken,
        tooltipProps: Omit<ICodeMirrorTooltipProps, 'hide'>
    ) {
        const markTextFrom = { line: pos.line, ch: token.start };
        const markTextTo = { line: pos.line, ch: token.end };

        const marker = editor.getDoc().markText(markTextFrom, markTextTo, {
            className: 'CodeMirror-hover',
            clearOnEnter: true,
        });
        this.marker = marker;

        const markerNodes = Array.from(
            editor
                .getScrollerElement()
                .getElementsByClassName('CodeMirror-hover')
        );

        if (markerNodes.length > 0) {
            let direction: 'up' | 'down' = null;
            if (markerNodes.length > 1) {
                // Since there is another marker in the way
                // and it is very likely to be a lint marker
                // so we show the tooltip direction to be down
                direction = 'down';
            }

            // Sanity check
            showTooltipFor(
                markerNodes,
                tooltipProps,
                () => {
                    if (marker) {
                        marker.clear();
                        this.marker = null;
                    }
                },
                direction
            );
        } else {
            // marker did not work
            marker.clear();
            this.marker = null;
        }
    }

    @bind
    public onOpenTableModal(editor: CodeMirror.Editor) {
        const pos = editor.getDoc().getCursor();
        const token = editor.getTokenAt(pos);

        isTokenInTable(
            pos,
            token,
            this.codeAnalysis,
            this.props.getTableByName
        ).then((tokenInsideTable) => {
            if (tokenInsideTable) {
                const { tableInfo } = tokenInsideTable;
                if (tableInfo) {
                    this.openTableModal(tableInfo.id);
                }
            }
        });
    }

    @bind
    public openTableModal(tableId: number) {
        navigateWithinEnv(`/table/${tableId}/`, {
            isModal: true,
        });
    }

    @throttle(500)
    public makeCodeAnalysis(value: string) {
        analyzeCode(value, 'autocomplete', this.props.language).then(
            (codeAnalysis) => {
                this.codeAnalysis = codeAnalysis;
                if (this.autocomplete) {
                    this.autocomplete.updateCodeAnalysis(this.codeAnalysis);
                }
            }
        );
    }

    @bind
    @debounce(500)
    public showAutoCompletion(editor: CodeMirror.Editor) {
        (CodeMirror as any).commands.autocomplete(editor, null, {
            completeSingle: false,
            passive: true,
        });
    }

    @bind
    public onKeyUp(editor: CodeMirror.Editor, event: KeyboardEvent) {
        if (
            !(
                editor.state.completionActive &&
                editor.state.completionActive.widget
            ) &&
            !ExcludedTriggerKeys[(event.keyCode || event.which).toString()]
        ) {
            this.showAutoCompletion(editor);
        }
    }

    @bind
    public getEditorSelection(editor?: CodeMirror.Editor) {
        editor = editor || this.editor;
        const selectionRange = editor
            ? {
                  from: editor.getDoc().getCursor('start'),
                  to: editor.getDoc().getCursor('end'),
              }
            : null;

        if (
            selectionRange.from.line === selectionRange.to.line &&
            selectionRange.from.ch === selectionRange.to.ch
        ) {
            return null;
        }

        return selectionRange;
    }

    @throttle(1000)
    @bind
    public onCursorActivity(editor: CodeMirror.Editor) {
        if (this.props.onSelection) {
            const selectionRange = this.getEditorSelection(editor);
            this.props.onSelection(
                selectionRange ? editor.getDoc().getSelection() : '',
                selectionRange
            );
        }
    }

    @bind
    public onKeyDown(editor: CodeMirror.Editor, event: KeyboardEvent) {
        if (this.props.onKeyDown) {
            this.props.onKeyDown(editor, event);
        }
    }

    @bind
    public onFocus(editor: CodeMirror.Editor, event) {
        if (this.autocomplete) {
            this.autocomplete.registerHelper();
        }

        const { readOnly } = this.props;
        const { lintingOn } = this.state;

        if (!readOnly && !lintingOn) {
            this.setState({
                lintingOn: true,
            });
        }

        if (this.props.onFocus) {
            this.props.onFocus(editor, event);
        }
    }

    @bind
    public onBlur(editor: CodeMirror.Editor, event) {
        if (this.props.onBlur) {
            this.props.onBlur(editor, event);
        }
    }

    @bind
    public onBeforeChange(editor: CodeMirror.Editor, data, value: string) {
        if (this.props.onChange) {
            this.props.onChange(value);
        }

        this.makeCodeAnalysis(value);
    }

    @bind
    public onRenderLine(editor: CodeMirror.Editor, line, element) {
        const charWidth = this.editor.defaultCharWidth();

        const basePadding = 4;
        const offset =
            CodeMirror.countColumn(
                line.text,
                null,
                editor.getOption('tabSize')
            ) * charWidth;
        element.style.textIndent = '-' + offset + 'px';
        element.style.paddingLeft = basePadding + offset + 'px';
    }

    @bind
    @debounce(600)
    public async onTextHover(editor: CodeMirror.Editor, node, e, pos, token) {
        if (
            this.marker == null &&
            (token.type === 'variable-2' || token.type == null)
        ) {
            // Check if token is inside a table
            const tokenInsideTable = await isTokenInTable(
                pos,
                token,
                this.codeAnalysis,
                this.props.getTableByName
            );

            if (tokenInsideTable) {
                const { tableInfo } = tokenInsideTable;
                if (tableInfo) {
                    this.markTextAndShowTooltip(editor, pos, token, {
                        tableId: tableInfo.id,
                        openTableModal: () => this.openTableModal(tableInfo.id),
                    });
                } else {
                    this.markTextAndShowTooltip(editor, pos, token, {
                        error: 'Table does not exist!',
                    });
                }
            }

            const nextChar = editor.getDoc().getLine(pos.line)[token.end];
            if (nextChar === '(') {
                // if it seems like a function call
                const functionDef = this.matchFunctionWithDefinition(
                    token.string
                );
                if (functionDef) {
                    this.markTextAndShowTooltip(editor, pos, token, {
                        functionDocumentations: functionDef,
                    });
                }
            }
        }
    }

    @bind
    public editorDidMount(editor: CodeMirror.Editor) {
        this.editor = editor;

        // There is a strange bug where codemirror would start with the wrong height (on fullscreen open)
        // which can only be solved by clicking on it
        // The current work around is to add refresh on mount
        setTimeout(() => {
            editor.refresh();
        }, 50);

        // FIXME: disabling this because it damages chrome performance
        // if (this.props.lineWrapping) {
        //     this.editor.on('renderLine', this.onRenderLine);
        // }
    }

    @bind
    public toggleFullScreen() {
        this.setState({
            fullScreen: !this.state.fullScreen,
        });
    }

    @bind
    public getEditor() {
        return this.editor;
    }

    @bind
    public getCodeAnalysis() {
        return this.codeAnalysis;
    }

    @bind
    public formatQuery(options = {}) {
        if (this.editor) {
            const indentWithTabs = this.editor.getOption('indentWithTabs');
            const indentUnit = this.editor.getOption('indentUnit');
            options['indent'] = indentWithTabs ? '\t' : ' '.repeat(indentUnit);
        }

        const formattedQuery = format(
            this.props.value,
            this.props.language,
            options
        );
        if (this.editor) {
            this.editor.setValue(formattedQuery);
        }
    }

    public componentDidMount() {
        this.makeCodeAnalysis(this.props.value);
        this.makeAutocompleter();
    }

    public componentDidUpdate(prevProps, prevState) {
        const newOptions = this.createOptions();
        if (newOptions !== this.state.options) {
            this.setState({
                options: newOptions,
            });
        }

        if (this.state.fullScreen !== prevState.fullScreen) {
            this.getEditor().refresh();
        }

        this.makeAutocompleter();
    }

    public render() {
        const { height, fontSize, className, allowFullScreen } = this.props;
        const { fullScreen } = this.state;

        const editorClassName = clsx({
            fullScreen,
            [className]: !!className,
        });

        const fullScreenButton = allowFullScreen && (
            <div className="fullscreen-button-wrapper">
                <Button
                    icon="maximize"
                    onClick={this.toggleFullScreen}
                    theme="text"
                    pushable
                />
            </div>
        );

        return (
            <StyledQueryEditor
                className={editorClassName}
                height={height}
                fontSize={fontSize}
            >
                {fullScreenButton}
                <ReactCodeMirror
                    editorDidMount={this.editorDidMount}
                    options={this.state.options}
                    value={this.props.value}
                    onBeforeChange={this.onBeforeChange}
                    onKeyUp={this.onKeyUp}
                    onCursorActivity={this.onCursorActivity}
                    onKeyDown={this.onKeyDown}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur}
                />
            </StyledQueryEditor>
        );
    }
}
