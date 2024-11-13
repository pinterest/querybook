import React, { useContext, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import {
    IQueryEditorHandles,
    IQueryEditorProps,
    QueryEditor,
} from 'components/QueryEditor/QueryEditor';
import { IQueryEngine } from 'const/queryEngine';
import { SearchAndReplaceContext } from 'context/searchAndReplace';
import { useUserQueryEditorConfig } from 'hooks/redux/useUserQueryEditorConfig';
import { useForwardedRef } from 'hooks/useForwardedRef';
import {
    fetchDataTableByNameIfNeeded,
    fetchFunctionDocumentationIfNeeded,
} from 'redux/dataSources/action';

export const BoundQueryEditor = React.forwardRef<
    IQueryEditorHandles,
    Omit<
        IQueryEditorProps,
        | 'theme'
        | 'autoCompleteType'
        | 'fontSize'
        | 'getTableByName'
        | 'functionDocumentationByNameByLanguage'
        | 'metastoreId'
        | 'language'
        | 'engineId'
        | 'searchContext'
    > & {
        engine?: IQueryEngine;
        cellId?: number;
    }
>(({ options: propOptions, keyMap, engine, cellId, ...otherProps }, ref) => {
    const dispatch = useDispatch();
    const searchContext = useContext(SearchAndReplaceContext);
    const editorRef = useForwardedRef<IQueryEditorHandles>(ref);

    // Code Editor related Props
    const { codeEditorTheme, options, fontSize, autoCompleteType } =
        useUserQueryEditorConfig();
    const combinedOptions = useMemo(
        () => ({
            ...options,
            ...propOptions,
        }),
        [propOptions, options]
    );

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

    return (
        <QueryEditor
            {...otherProps}
            ref={editorRef}
            options={combinedOptions}
            keyMap={keyMap}
            theme={codeEditorTheme}
            autoCompleteType={autoCompleteType}
            fontSize={fontSize}
            getTableByName={fetchDataTable}
            metastoreId={engine?.metastore_id}
            language={engine?.language}
            searchContext={searchContext}
            cellId={cellId}
            engineId={engine?.id}
        />
    );
});
