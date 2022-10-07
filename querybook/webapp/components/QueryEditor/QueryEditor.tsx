import clsx from 'clsx';
import { debounce, find, throttle } from 'lodash';
import React, {
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Controlled as ReactCodeMirror } from 'react-codemirror2';

import { showTooltipFor } from 'components/CodeMirrorTooltip';
import { ICodeMirrorTooltipProps } from 'components/CodeMirrorTooltip/CodeMirrorTooltip';
import KeyMap from 'const/keyMap';
import {
    FunctionDocumentationCollection,
    tableNameDataTransferName,
} from 'const/metastore';
import CodeMirror, { CodeMirrorKeyMap } from 'lib/codemirror';
import {
    AutoCompleteType,
    ExcludedTriggerKeys,
    SqlAutoCompleter,
} from 'lib/sql-helper/sql-autocompleter';
import { getContextSensitiveWarnings } from 'lib/sql-helper/sql-context-sensitive-linter';
import { format } from 'lib/sql-helper/sql-formatter';
import {
    ICodeAnalysis,
    ILinterWarning,
    IRange,
    IToken,
    TableToken,
} from 'lib/sql-helper/sql-lexer';
import { isQueryUsingTemplating } from 'lib/templated-query/validation';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { analyzeCode } from 'lib/web-worker';
import { Button } from 'ui/Button/Button';

import {
    IStyledQueryEditorProps,
    StyledQueryEditor,
} from './StyledQueryEditor';

import './QueryEditor.scss';

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

    getLintErrors?: (
        query: string,
        editor: CodeMirror.Editor
    ) => Promise<ILinterWarning[]>;
    onLintCompletion?: (hasError?: boolean) => void;
}

export interface IQueryEditorHandles {
    getEditor: () => CodeMirror.Editor;
    formatQuery: (options?: {
        case?: 'lower' | 'upper';
        indent?: string;
    }) => void;
    getEditorSelection: (editor?: CodeMirror.Editor) => IRange;
}

export const QueryEditor: React.FC<
    IQueryEditorProps & {
        ref: React.Ref<IQueryEditorHandles>;
    }
> = React.forwardRef<IQueryEditorHandles, IQueryEditorProps>(
    (
        {
            options = {},
            value = '',

            lineWrapping = false,
            readOnly,
            language = 'hive',
            theme = 'default',
            functionDocumentationByNameByLanguage = {},
            metastoreId,
            keyMap = {},
            className,
            autoCompleteType = 'all',
            allowFullScreen = false,

            onChange,
            onKeyDown,
            onFocus,
            onBlur,
            onSelection,
            getTableByName,

            getLintErrors,
            onLintCompletion,

            // props from IStyledQueryEditorProps
            height = 'auto',
            fontSize,
        },
        ref
    ) => {
        const markerRef = useRef(null);
        const codeAnalysisRef = useRef<ICodeAnalysis>(null);
        const editorRef = useRef<CodeMirror.Editor>(null);
        const autocompleteRef = useRef<SqlAutoCompleter>(null);
        const tablesGettingLoadedRef = useRef<Set<string>>(new Set());

        const [fullScreen, setFullScreen] = useState(false);

        const makeCodeAnalysis = useMemo(
            () =>
                throttle((value: string) => {
                    analyzeCode(value, 'autocomplete', language).then(
                        (codeAnalysis) => {
                            codeAnalysisRef.current = codeAnalysis;

                            autocompleteRef.current?.updateCodeAnalysis(
                                codeAnalysis
                            );
                        }
                    );
                }, 500),
            [language]
        );

        const performLint = useMemo(
            () =>
                debounce(() => {
                    editorRef.current.performLint();
                }, 2000),
            []
        );

        const openTableModal = useCallback((tableId: number) => {
            navigateWithinEnv(`/table/${tableId}/`, {
                isModal: true,
            });
        }, []);

        // Checks if token is in table, returns the table if found, false otherwise
        const isTokenInTable = useCallback(
            async (pos: CodeMirror.Position, token: CodeMirror.Token) => {
                if (codeAnalysisRef.current && token) {
                    const selectionLine = pos.line;
                    const selectionPos = {
                        from: token.start,
                        to: token.end,
                    };

                    const tableReferences: TableToken[] = [].concat.apply(
                        [],
                        Object.values(
                            codeAnalysisRef.current.lineage.references
                        )
                    );

                    let tablePosFound = null;
                    const table = find(tableReferences, (tableInfo) => {
                        if (tableInfo.line === selectionLine) {
                            const isSchemaExplicit =
                                tableInfo.end - tableInfo.start >
                                tableInfo.name.length;
                            const tablePos = {
                                from:
                                    tableInfo.start +
                                    (isSchemaExplicit
                                        ? tableInfo.schema.length
                                        : 0),
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
                        const tableInfo = await getTableByName(
                            table.schema,
                            table.name
                        );
                        return {
                            tableInfo,
                            tablePosFound,
                        };
                    }
                }

                return false;
            },
            [getTableByName]
        );

        const onOpenTableModal = useCallback(
            (editor: CodeMirror.Editor) => {
                const pos = editor.getDoc().getCursor();
                const token = editor.getTokenAt(pos);

                isTokenInTable(pos, token).then((tokenInsideTable) => {
                    if (tokenInsideTable) {
                        const { tableInfo } = tokenInsideTable;
                        if (tableInfo) {
                            openTableModal(tableInfo.id);
                        }
                    }
                });
            },
            [isTokenInTable, openTableModal]
        );

        const prefetchDataTables = useCallback(
            async (tableReferences: TableToken[]) => {
                if (!getTableByName) {
                    return;
                }

                const tableLoadPromises = [];
                for (const { schema, name } of tableReferences) {
                    const fullName = `${schema}.${name}`;
                    if (!tablesGettingLoadedRef.current.has(fullName)) {
                        tableLoadPromises.push(getTableByName(schema, name));
                        tablesGettingLoadedRef.current.add(fullName);
                    }
                }

                await Promise.all(tableLoadPromises);
            },
            [getTableByName]
        );

        const getLintAnnotations = useMemo(
            () =>
                debounce(
                    async (
                        code: string,
                        onComplete: (warnings: ILinterWarning[]) => void,
                        _options: any,
                        editor: CodeMirror.Editor
                    ) => {
                        const annotations = [];

                        // prefetch tables and get table warning annotations
                        if (metastoreId && codeAnalysisRef.current) {
                            const tableReferences = [].concat.apply(
                                [],
                                Object.values(
                                    codeAnalysisRef.current.lineage.references
                                )
                            );
                            await prefetchDataTables(tableReferences);

                            const contextSensitiveWarnings =
                                getContextSensitiveWarnings(
                                    metastoreId,
                                    tableReferences,
                                    !!getLintErrors
                                );
                            annotations.push(...contextSensitiveWarnings);
                        }

                        // if query is empty skip check
                        // if it is using templating, also skip check since
                        // there is no reliable way to map it back
                        if (
                            code.length > 0 &&
                            !isQueryUsingTemplating(code) &&
                            getLintErrors
                        ) {
                            const warnings = await getLintErrors(code, editor);
                            annotations.push(...warnings);
                        }

                        if (onLintCompletion) {
                            onLintCompletion(
                                annotations.filter(
                                    (warning) => warning.severity === 'error'
                                ).length > 0
                            );
                        }

                        onComplete(annotations);
                    },
                    2000
                ),
            [metastoreId, getLintErrors, onLintCompletion, prefetchDataTables]
        );

        const formatQuery = useCallback(
            (
                options: {
                    case?: 'lower' | 'upper';
                    indent?: string;
                } = {}
            ) => {
                if (editorRef.current) {
                    const indentWithTabs =
                        editorRef.current.getOption('indentWithTabs');
                    const indentUnit =
                        editorRef.current.getOption('indentUnit');
                    options['indent'] = indentWithTabs
                        ? '\t'
                        : ' '.repeat(indentUnit);
                }

                const formattedQuery = format(value, language, options);
                editorRef.current?.setValue(formattedQuery);
            },
            [language, value]
        );

        const markTextAndShowTooltip = (
            editor: CodeMirror.Editor,
            pos: CodeMirror.Position,
            token: IToken,
            tooltipProps: Omit<ICodeMirrorTooltipProps, 'hide'>
        ) => {
            const markTextFrom = { line: pos.line, ch: token.start };
            const markTextTo = { line: pos.line, ch: token.end };

            markerRef.current = editor
                .getDoc()
                .markText(markTextFrom, markTextTo, {
                    className: 'CodeMirror-hover',
                    clearOnEnter: true,
                });

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
                        markerRef.current?.clear();
                        markerRef.current = null;
                    },
                    direction
                );
            } else {
                // marker did not work
                markerRef.current?.clear();
                markerRef.current = null;
            }
        };

        const matchFunctionWithDefinition = useCallback(
            (functionName: string) => {
                if (
                    language &&
                    language in functionDocumentationByNameByLanguage
                ) {
                    const functionDefs =
                        functionDocumentationByNameByLanguage[language];
                    const functionNameLower = (
                        functionName || ''
                    ).toLowerCase();

                    if (functionNameLower in functionDefs) {
                        return functionDefs[functionNameLower];
                    }
                }

                return null;
            },
            [language, functionDocumentationByNameByLanguage]
        );

        const onTextHover = useMemo(
            () =>
                debounce(
                    async (editor: CodeMirror.Editor, node, e, pos, token) => {
                        if (
                            markerRef.current == null &&
                            (token.type === 'variable-2' || token.type == null)
                        ) {
                            // Check if token is inside a table
                            const tokenInsideTable = await isTokenInTable(
                                pos,
                                token
                            );

                            if (tokenInsideTable) {
                                const { tableInfo } = tokenInsideTable;
                                if (tableInfo) {
                                    markTextAndShowTooltip(editor, pos, token, {
                                        tableId: tableInfo.id,
                                        openTableModal: () =>
                                            openTableModal(tableInfo.id),
                                    });
                                } else {
                                    markTextAndShowTooltip(editor, pos, token, {
                                        error: 'Table does not exist!',
                                    });
                                }
                            }

                            const nextChar = editor.getDoc().getLine(pos.line)[
                                token.end
                            ];
                            if (nextChar === '(') {
                                // if it seems like a function call
                                const functionDef = matchFunctionWithDefinition(
                                    token.string
                                );
                                if (functionDef) {
                                    markTextAndShowTooltip(editor, pos, token, {
                                        functionDocumentations: functionDef,
                                    });
                                }
                            }
                        }
                    },
                    600
                ),
            [isTokenInTable, matchFunctionWithDefinition, openTableModal]
        );

        const showAutoCompletion = useMemo(
            () =>
                debounce((editor: CodeMirror.Editor) => {
                    (CodeMirror as any).commands.autocomplete(editor, null, {
                        completeSingle: false,
                        passive: true,
                    });
                }, 500),
            []
        );

        const getEditorSelection = useCallback((editor?: CodeMirror.Editor) => {
            editor = editor || editorRef.current;
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
        }, []);

        useEffect(() => {
            makeCodeAnalysis(value);
            performLint();
        }, [value, makeCodeAnalysis, performLint]);

        // Make auto completer
        useEffect(() => {
            if (language != null) {
                autocompleteRef.current = new SqlAutoCompleter(
                    CodeMirror,
                    language,
                    metastoreId,
                    autoCompleteType
                );
            }
        }, [language, metastoreId, autoCompleteType]);

        useEffect(() => {
            editorRef.current?.refresh();
        }, [fullScreen]);

        useImperativeHandle(
            ref,
            () => ({
                getEditor: () => editorRef.current,
                formatQuery,
                getEditorSelection,
            }),
            [formatQuery, getEditorSelection]
        );

        const toggleFullScreen = () => {
            setFullScreen(!fullScreen);
        };

        /* ---- start of <ReactCodeMirror /> properties ---- */

        const editorOptions: Record<string, unknown> = useMemo(() => {
            const lintingOptions = !readOnly
                ? {
                      lint: {
                          // Lint only when you can edit
                          getAnnotations: getLintAnnotations,
                          async: true,
                          lintOnChange: false,
                      },
                  }
                : {};

            const editorOptions = {
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
                    [KeyMap.queryEditor.swapLineUp.key]: 'swapLineUp',
                    [KeyMap.queryEditor.swapLineDown.key]: 'swapLineDown',
                    [KeyMap.queryEditor.addCursorToPrevLine.key]:
                        'addCursorToPrevLine',
                    [KeyMap.queryEditor.addCursorToNextLine.key]:
                        'addCursorToNextLine',

                    [KeyMap.queryEditor.openTable.key]: onOpenTableModal,
                    [KeyMap.queryEditor.formatQuery.key]: formatQuery,
                    ...keyMap,
                },
                indentUnit: 4,
                textHover: onTextHover,
                theme,
                matchBrackets: true,
                autoCloseBrackets: true,
                highlightSelectionMatches: true,

                // Readonly related options
                readOnly,
                cursorBlinkRate: readOnly ? -1 : 530,

                // viewportMargin: Infinity,
                ...lintingOptions,
                ...options,
            };

            return editorOptions;
        }, [
            options,
            lineWrapping,
            readOnly,
            theme,
            keyMap,
            formatQuery,
            getLintAnnotations,
            onOpenTableModal,
            onTextHover,
        ]);

        const editorDidMount = useCallback((editor: CodeMirror.Editor) => {
            editorRef.current = editor;
        }, []);

        const onBeforeChange = useCallback(
            (editor: CodeMirror.Editor, data, value: string) => {
                if (onChange) {
                    onChange(value);
                }

                makeCodeAnalysis(value);
                performLint();
            },
            [makeCodeAnalysis, onChange, performLint]
        );

        const handleOnBlur = useCallback(
            (editor: CodeMirror.Editor, event) => {
                onBlur?.(editor, event);
            },
            [onBlur]
        );

        const handleOnCursorActivity = useMemo(
            () =>
                throttle((editor: CodeMirror.Editor) => {
                    if (onSelection) {
                        const selectionRange = getEditorSelection(editor);
                        onSelection(
                            selectionRange
                                ? editor.getDoc().getSelection()
                                : '',
                            selectionRange
                        );
                    }
                }, 1000),
            [getEditorSelection, onSelection]
        );

        const handleOnDrop = useCallback(
            (editor: CodeMirror.Editor, event: React.DragEvent) => {
                const tableNameData: string = event.dataTransfer.getData(
                    tableNameDataTransferName
                );

                if (tableNameData) {
                    editor.focus();
                    const { pageX, pageY } = event;
                    editor.setCursor(
                        editor.coordsChar({ left: pageX, top: pageY })
                    );
                    editor.replaceRange(
                        ` ${tableNameData} `,
                        editor.getCursor()
                    );
                }
            },
            []
        );

        const handleOnFocus = useCallback(
            (editor: CodeMirror.Editor, event) => {
                autocompleteRef.current?.registerHelper();

                if (onFocus) {
                    onFocus(editor, event);
                }
            },
            [onFocus]
        );

        const handleOnKeyUp = useCallback(
            (editor: CodeMirror.Editor, event: KeyboardEvent) => {
                if (
                    !(
                        editor.state.completionActive &&
                        editor.state.completionActive.widget
                    ) &&
                    !ExcludedTriggerKeys[
                        (event.keyCode || event.which).toString()
                    ]
                ) {
                    showAutoCompletion(editor);
                }
            },
            [showAutoCompletion]
        );

        const handleOnKeyDown = useCallback(
            (editor: CodeMirror.Editor, event) => {
                onKeyDown?.(editor, event);
            },
            [onKeyDown]
        );
        /* ---- end of <ReactCodeMirror /> properties ---- */

        const editorClassName = clsx({
            fullScreen,
            [className]: !!className,
        });

        const fullScreenButton = allowFullScreen && (
            <div className="fullscreen-button-wrapper mt4">
                <Button
                    icon={fullScreen ? 'Minimize2' : 'Maximize2'}
                    onClick={toggleFullScreen}
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
                    value={value}
                    options={editorOptions}
                    editorDidMount={editorDidMount}
                    onBeforeChange={onBeforeChange}
                    onBlur={handleOnBlur}
                    onCursorActivity={handleOnCursorActivity}
                    onDrop={handleOnDrop}
                    onFocus={handleOnFocus}
                    onKeyUp={handleOnKeyUp}
                    onKeyDown={handleOnKeyDown}
                />
            </StyledQueryEditor>
        );
    }
);
