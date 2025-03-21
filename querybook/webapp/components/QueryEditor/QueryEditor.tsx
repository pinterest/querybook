import { indentService } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import clsx from 'clsx';
import React, {
    useCallback,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react';
import toast from 'react-hot-toast';

import { CodeEditor } from 'components/CodeEditor/CodeEditor';
import { TDataDocMetaVariables } from 'const/datadoc';
import KeyMap from 'const/keyMap';
import { IDataTable } from 'const/metastore';
import {
    AutoCompleteType,
    useAutoCompleteExtension,
} from 'hooks/queryEditor/extensions/useAutoCompleteExtension';
import { useHoverTooltipExtension } from 'hooks/queryEditor/extensions/useHoverTooltipExtension';
import { useLintExtension } from 'hooks/queryEditor/extensions/useLintExtension';
import { useSqlCompleteExtension } from 'hooks/queryEditor/extensions/useSqlCompleteExtension';
import { useStatusBarExtension } from 'hooks/queryEditor/extensions/useStatusBarExtension';
import { useCodeAnalysis } from 'hooks/queryEditor/useCodeAnalysis';
import { useLint } from 'hooks/queryEditor/useLint';
import { useSqlParser } from 'hooks/queryEditor/useSqlParser';
import useDeepCompareEffect from 'hooks/useDeepCompareEffect';
import { CodeMirrorKeyMap } from 'lib/codemirror';
import { mixedSQL } from 'lib/codemirror/codemirror-mixed';
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
    sqlCompleteEnabled?: boolean;

    engineId: number;
    templatedVariables?: TDataDocMetaVariables;
    cellId?: number;

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
            metastoreId,
            keyMap = {},
            className,
            autoCompleteType = 'all',
            sqlCompleteEnabled = false,
            engineId,
            cellId,
            templatedVariables = [],

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

        const { codeAnalysis } = useCodeAnalysis({
            language,
            query: value,
        });
        const sqlParserRef = useSqlParser(metastoreId, language, codeAnalysis);

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

        const statusBarExtension = useStatusBarExtension({
            isLinting,
            lintSummary,
        });

        const autoCompleteExtension = useAutoCompleteExtension({
            view: editorRef.current?.view,
            sqlParserRef,
            type: autoCompleteType,
        });

        const lintExtension = useLintExtension({
            lintDiagnostics,
        });

        const { extension: hoverTooltipExtension, getTableAtCursor } =
            useHoverTooltipExtension({
                sqlParserRef,
                metastoreId,
                language,
            });

        const openTableModalCommand = useCallback(
            (editorView: EditorView) => {
                const table = getTableAtCursor(editorView);
                if (table) {
                    getTableByName(table.schema, table.name).then(
                        (tableInfo) => {
                            if (tableInfo) {
                                navigateWithinEnv(`/table/${tableInfo.id}/`, {
                                    isModal: true,
                                });
                            }
                        }
                    );
                }
                return true;
            },
            [getTableAtCursor, getTableByName]
        );

        const keyBindings = useMemo(
            () => [
                {
                    key: KeyMap.codeEditor.formatQuery.key,
                    run: () => {
                        formatQuery({ case: 'upper' });
                        return true;
                    },
                },
                {
                    key: KeyMap.codeEditor.openTable.key,
                    run: openTableModalCommand,
                },
            ],
            [formatQuery, openTableModalCommand]
        );

        const sqlCompleteExtension = useSqlCompleteExtension({
            enabled: sqlCompleteEnabled,
            engineId,
            tables: tableNamesSet,
        });

        const extensions = useMemo(
            () => [
                mixedSQL(language),
                statusBarExtension,
                lintExtension,
                autoCompleteExtension,
                hoverTooltipExtension,
                sqlCompleteExtension,
                indentService.of((context, pos) => {
                    if (pos === 0) {
                        return 0;
                    }
                    return context.lineIndent(pos - 1);
                }),
            ],
            [
                language,
                statusBarExtension,
                lintExtension,
                autoCompleteExtension,
                hoverTooltipExtension,
                sqlCompleteExtension,
            ]
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
                <CodeEditor
                    ref={editorRef}
                    height={height}
                    value={value}
                    cellId={cellId}
                    lineWrapping={lineWrapping}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    keyMap={keyMap}
                    keyBindings={keyBindings}
                    extensions={extensions}
                    readonly={readOnly}
                    onChange={onChange}
                    onSelection={onSelection}
                />
            </div>
        );
    }
);
