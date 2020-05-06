import React, { useMemo, useEffect } from 'react';

import { useUserQueryEditorConfig } from 'hooks/redux/useUserQueryEditorConfig';
import { IQueryEditorProps, QueryEditor } from './QueryEditor';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchDataTableByNameIfNeeded,
    fetchFunctionDocumentationIfNeeded,
} from 'redux/dataSources/action';
import { IQueryEngine } from 'const/queryEngine';
import { IStoreState } from 'redux/store/types';

export const BindedQueryEditor = React.forwardRef<
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
    }
>(
    (
        { options: propOptions, keyMap: propKeyMap, engine, ...otherProps },
        ref
    ) => {
        const dispatch = useDispatch();

        // Code Editor related Props
        const {
            codeEditorTheme,
            keyMap,
            options,
            fontSize,
            autoCompleteType,
        } = useUserQueryEditorConfig();
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
            []
        );

        // Function Documentation related props
        const functionDocumentationByNameByLanguage = useSelector(
            (state: IStoreState) =>
                state.dataSources.functionDocumentationByNameByLanguage
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

        return (
            <QueryEditor
                {...otherProps}
                ref={ref}
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
    }
);
