import { acceptCompletion, startCompletion } from '@codemirror/autocomplete';
import { sql } from '@codemirror/lang-sql';
import { EditorView } from '@codemirror/view';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import clsx from 'clsx';
import React, {
    useCallback,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';
import toast from 'react-hot-toast';

import { TDataDocMetaVariables } from 'const/datadoc';
import KeyMap from 'const/keyMap';
import { IDataTable } from 'const/metastore';
import { ISearchAndReplaceContextType } from 'context/searchAndReplace';
import { useAutoCompleteExtension } from 'hooks/queryEditor/extensions/useAutoCompleteExtension';
import { useEventsExtension } from 'hooks/queryEditor/extensions/useEventsExtension';
import { useHoverTooltipExtension } from 'hooks/queryEditor/extensions/useHoverTooltipExtension';
import { useKeyMapExtension } from 'hooks/queryEditor/extensions/useKeyMapExtension';
import { useLintExtension } from 'hooks/queryEditor/extensions/useLintExtension';
import { useOptionsExtension } from 'hooks/queryEditor/extensions/useOptionsExtension';
import { useSearchExtension } from 'hooks/queryEditor/extensions/useSearchExtension';
import { useStatusBarExtension } from 'hooks/queryEditor/extensions/useStatusBarExtension';
import { useAutoComplete } from 'hooks/queryEditor/useAutoComplete';
import { useCodeAnalysis } from 'hooks/queryEditor/useCodeAnalysis';
import { useLint } from 'hooks/queryEditor/useLint';
import useDeepCompareEffect from 'hooks/useDeepCompareEffect';
import { CodeMirrorKeyMap } from 'lib/codemirror';
import { AutoCompleteType } from 'lib/sql-helper/sql-autocompleter';
import { format, ISQLFormatOptions } from 'lib/sql-helper/sql-formatter';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { IconButton } from 'ui/Button/IconButton';

import './QueryEditor.scss';

export interface IQueryEditorProps {
    options?: Record<string, any>;
    value?: string;

    lineWrapping?: boolean;
    readOnly?: boolean;
    language?: string;
    theme?: string;
    metastoreId?: number;
    keyMap?: CodeMirrorKeyMap;
    className?: string;
    autoCompleteType?: AutoCompleteType;

    engineId: number;
    templatedVariables?: TDataDocMetaVariables;
    cellId?: number;
    searchContext?: ISearchAndReplaceContextType;

    fontSize?: string;
    height?: 'auto' | 'full' | 'fixed';

    hasQueryLint?: boolean;

    /**
     * If provided, then the container component will handle the fullscreen logic
     */
    onFullScreen?: (fullScreen: boolean) => void;

    onChange?: (value: string) => any;
    onKeyDown?: (editor: CodeMirror.Editor, event: KeyboardEvent) => any;
    onFocus?: () => any;
    onBlur?: () => any;
    onSelection?: (hasSelection: boolean) => any;
    onTablesChange?: (tables: Record<string, IDataTable>) => any;
    getTableByName?: (schema: string, name: string) => any;

    onLintCompletion?: (hasError?: boolean) => void;
}

export interface IQueryEditorHandles {
    focus: () => void;
    formatQuery: (options?: {
        case?: 'lower' | 'upper';
        indent?: string;
    }) => void;
    getSelection?: () => string;
}

export const QueryEditor: React.FC<
    IQueryEditorProps & {
        ref: React.Ref<IQueryEditorHandles>;
    }
> = React.forwardRef<IQueryEditorHandles, IQueryEditorProps>(
    (
        {
            options: propOptions = {},
            value = '',

            lineWrapping = false,
            readOnly,
            language = 'hive',
            theme = 'default',
            metastoreId,
            keyMap = {},
            className,
            autoCompleteType = 'all',
            engineId,
            cellId,
            templatedVariables = [],
            searchContext,

            hasQueryLint,
            height = 'auto',
            fontSize,

            onFullScreen,
            onChange,
            onFocus,
            onBlur,
            onSelection,
            onTablesChange,
            getTableByName,

            onLintCompletion,
        },
        ref
    ) => {
        const editorRef = React.useRef<ReactCodeMirrorRef>();
        const [fullScreen, setFullScreen] = useState(false);

        const formatQuery = useCallback(
            (options: ISQLFormatOptions) => {
                options = {
                    silent: false, // default false to throw format errors
                    ...options,
                };
                const indentWithTabs = propOptions.indentWithTabs;
                const indentUnit = propOptions.indentUnit;
                if (indentWithTabs) {
                    options.useTabs = true;
                } else {
                    options.tabWidth = indentUnit as number;
                }
                try {
                    const editorState = editorRef.current.view.state;
                    const value = editorState.doc.toString();
                    const formattedQuery = format(value, language, options);
                    editorRef.current?.view.dispatch({
                        changes: {
                            from: 0,
                            to: value.length,
                            insert: formattedQuery,
                        },
                    });
                } catch (e) {
                    const errorMessage = e.message ?? '';
                    // The error message from sql-formatter is huge, and usually only the first line is helpful.
                    const firstLine =
                        errorMessage.substring(0, errorMessage.indexOf('\n')) ||
                        errorMessage;
                    toast.error(firstLine || 'Failed to format query.');
                }
            },
            [language, propOptions]
        );

        const getSelectedText = useCallback(() => {
            if (editorRef.current?.view) {
                const editorState = editorRef.current.view.state;
                if (!editorState.selection.main.empty) {
                    return editorState.sliceDoc(
                        editorState.selection.main.from,
                        editorState.selection.main.to
                    );
                }

                return value;
            }
            return value;
        }, [editorRef.current?.view, value]);

        useImperativeHandle(
            ref,
            () => ({
                focus: () => editorRef.current?.view?.focus(),
                formatQuery,
                getSelection: getSelectedText,
            }),
            [formatQuery, getSelectedText]
        );

        const toggleFullScreen = useCallback(() => {
            setFullScreen((fullScreen) => {
                onFullScreen?.(!fullScreen);
                return !fullScreen;
            });
        }, [onFullScreen]);

        const { codeAnalysis, codeAnalysisRef } = useCodeAnalysis({
            language,
            query: value,
        });
        const autoCompleterRef = useAutoComplete(
            metastoreId,
            autoCompleteType,
            language,
            codeAnalysis
        );

        const tableReferences: TableToken[] = useMemo(
            () =>
                [].concat.apply(
                    [],
                    Object.values(codeAnalysis?.lineage.references ?? {})
                ),
            [codeAnalysis?.lineage.references]
        );
        const tableNamesSet = useMemo(
            () =>
                new Set(
                    tableReferences.map(
                        (table) => `${table.schema}.${table.name}`
                    )
                ),
            [tableReferences]
        );

        const { isLinting, lintDiagnostics, lintSummary, forceTableLint } =
            useLint({
                query: value,
                metastoreId,
                engineId,
                // templatedVariables: finalTemplatedVariables,
                templatedVariables,
                tableReferences,
                editorView: editorRef.current?.view,
                hasQueryLint,
                onLintCompletion,
            });

        useDeepCompareEffect(() => {
            Promise.all(
                tableReferences.map((tableRef) =>
                    getTableByName(tableRef.schema, tableRef.name)
                )
            ).then((tables) => {
                // do another lint after fetching the tables
                if (tableNamesSet.size > 0) {
                    forceTableLint();
                }

                const tablesMap = tableReferences.reduce(
                    (obj, tableRef, index) => {
                        if (tables[index]) {
                            const fullTableName = `${tableRef.schema}.${tableRef.name}`;
                            return { ...obj, [fullTableName]: tables[index] };
                        } else {
                            return obj;
                        }
                    },
                    {}
                );
                onTablesChange?.(tablesMap);
            });
        }, [tableNamesSet]);

        /* ---- start of CodeMirror properties ---- */

        const searchExtension = useSearchExtension({
            editorView: editorRef.current?.view,
            searchContext,
            cellId,
        });

        const eventsExtension = useEventsExtension({
            onFocus: (evt) => onFocus?.(),
            onBlur: (evt) => onBlur?.(),
        });

        const statusBarExtension = useStatusBarExtension({
            isLinting,
            lintSummary,
        });

        const autoCompleteExtension = useAutoCompleteExtension({
            view: editorRef.current?.view,
            autoCompleterRef,
        });

        const lintExtension = useLintExtension({
            lintDiagnostics,
        });

        const { extension: hoverTooltipExtension, getTableAtCursor } =
            useHoverTooltipExtension({
                codeAnalysisRef,
                metastoreId: 1,
            });

        const openTableModalCommand = useCallback((editorView: EditorView) => {
            const table = getTableAtCursor(editorView);
            if (table) {
                getTableByName(table.schema, table.name).then((tableInfo) => {
                    if (tableInfo) {
                        navigateWithinEnv(`/table/${tableInfo.id}/`, {
                            isModal: true,
                        });
                    }
                });
            }
            return true;
        }, []);

        const keyMapExtention = useKeyMapExtension({
            keyMap,
            keyBindings: [
                { key: 'Tab', run: acceptCompletion },
                {
                    key: KeyMap.queryEditor.autocomplete.key,
                    run: startCompletion,
                },
                {
                    key: KeyMap.queryEditor.formatQuery.key,
                    run: () => {
                        formatQuery({ case: 'upper' });
                        return true;
                    },
                },
                {
                    key: 'Cmd-F',
                    run: () => {
                        searchContext?.showSearchAndReplace();
                        return true;
                    },
                },
                {
                    key: KeyMap.queryEditor.openTable.key,
                    run: openTableModalCommand,
                },
            ],
        });

        const optionsExtension = useOptionsExtension({
            lineWrapping,
            options: propOptions,
        });

        const selectionExtension = useMemo(
            () =>
                EditorView.updateListener.of((update) => {
                    if (update.selectionSet) {
                        const selection = update.state.selection.main;
                        onSelection?.(!selection.empty);
                    }
                }),
            [onSelection]
        );

        const extensions = useMemo(() => {
            return [
                sql({
                    upperCaseKeywords: true,
                }),

                keyMapExtention,
                statusBarExtension,
                eventsExtension,
                lintExtension,
                autoCompleteExtension,
                hoverTooltipExtension,
                optionsExtension,
                searchExtension,
                selectionExtension,
            ];
        }, [
            keyMapExtention,
            statusBarExtension,
            eventsExtension,
            lintExtension,
            autoCompleteExtension,
            hoverTooltipExtension,
            optionsExtension,
            searchExtension,
            selectionExtension,
        ]);

        const basicSetup = useMemo(
            () => ({
                drawSelection: false,
                highlightSelectionMatches: true,
                searchKeymap: false,
                foldGutter: false,
            }),
            []
        );

        const onChangeHandler = useCallback(
            (value, viewUpdate) => {
                onChange?.(value);
            },
            [onChange]
        );
        /* ---- end of CodeMirror properties ---- */

        const floatButtons = (
            <div className="query-editor-float-buttons-wrapper flex-row mt8 mr8">
                <IconButton
                    icon={fullScreen ? 'Minimize2' : 'Maximize2'}
                    onClick={toggleFullScreen}
                    className="full-screen-button"
                    size={16}
                    noPadding
                />
            </div>
        );

        const editorClassName = clsx({
            fullScreen: !onFullScreen && fullScreen,
            [className]: !!className,
            QueryEditor: true,
        });

        return (
            <div
                className={editorClassName}
                style={{
                    fontSize: fontSize ?? undefined,
                }}
            >
                {floatButtons}
                <CodeMirror
                    ref={editorRef}
                    theme={theme === 'dark' ? 'dark' : 'light'}
                    className="ReactCodeMirror"
                    value={value}
                    height="100%"
                    maxHeight={height === 'auto' ? '50vh' : null}
                    extensions={extensions}
                    basicSetup={basicSetup}
                    editable={!readOnly}
                    autoFocus={false}
                    onChange={onChangeHandler}
                />
            </div>
        );
    }
);
