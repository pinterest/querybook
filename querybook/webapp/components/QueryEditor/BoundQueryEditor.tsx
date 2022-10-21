import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { CodeMirrorSearchHighlighter } from 'components/SearchAndReplace/CodeMirrorSearchHighlighter';
import { IQueryEngine } from 'const/queryEngine';
import { SearchAndReplaceContext } from 'context/searchAndReplace';
import { useUserQueryEditorConfig } from 'hooks/redux/useUserQueryEditorConfig';
import { useForwardedRef } from 'hooks/useForwardedRef';
import {
    fetchDataTableByNameIfNeeded,
    fetchFunctionDocumentationIfNeeded,
} from 'redux/dataSources/action';
import { IStoreState } from 'redux/store/types';

import { IQueryEditorProps, QueryEditor } from './QueryEditor';

export const BoundQueryEditor = React.forwardRef<
    QueryEditor,
    Omit<
        IQueryEditorProps,
        | 'theme'
        | 'autoCompleteType'
        | 'fontSize'
        | 'getTableByName'
        | 'functionDocumentationByNameByLanguage'
        | 'metastoreId'
        | 'language'
    > & {
        engine?: IQueryEngine;
        cellId?: number;
    }
>(
    (
        {
            options: propOptions,
            keyMap: propKeyMap,
            engine,
            cellId,
            ...otherProps
        },
        ref
    ) => {
        const dispatch = useDispatch();
        const searchContext = useContext(SearchAndReplaceContext);
        const editorRef = useForwardedRef(ref);

        // Code Editor related Props
        const { codeEditorTheme, keyMap, options, fontSize, autoCompleteType } =
            useUserQueryEditorConfig(searchContext);
        const combinedOptions = useMemo(
            () => ({
                ...options,
                ...propOptions,
            }),
            [propOptions, options]
        );

        const combinedKeyMap = useMemo(
            () => ({
                ...keyMap,
                ...propKeyMap,
            }),
            [keyMap, propKeyMap]
        );

        // Function Documentation related props
        const functionDocumentationByNameByLanguage = useSelector(
            (state: IStoreState) =>
                state.dataSources.functionDocumentation.byNameByLanguage
        );
        useEffect(() => {
            if (engine?.language) {
                dispatch(fetchFunctionDocumentationIfNeeded(engine?.language));
            }
        }, [engine?.language]);

        // Metastore related props
        const fetchDataTable = React.useCallback(
            (schemaName: string, tableName: string) => {
                if (engine != null) {
                    return dispatch(
                        fetchDataTableByNameIfNeeded(
                            schemaName,
                            tableName,
                            engine.metastore_id
                        )
                    );
                }
            },
            [engine]
        );

        const queryEditor = (
            <QueryEditor
                {...otherProps}
                ref={editorRef}
                options={combinedOptions}
                keyMap={combinedKeyMap}
                theme={codeEditorTheme}
                autoCompleteType={autoCompleteType}
                fontSize={fontSize}
                getTableByName={fetchDataTable}
                functionDocumentationByNameByLanguage={
                    functionDocumentationByNameByLanguage
                }
                metastoreId={engine?.metastore_id}
                language={engine?.language}
            />
        );

        return searchContext ? (
            <>
                {queryEditor}
                <CodeMirrorSearchHighlighter
                    searchContext={searchContext}
                    cellId={cellId}
                    editor={editorRef.current?.getEditor()}
                />
            </>
        ) : (
            queryEditor
        );
    }
);
