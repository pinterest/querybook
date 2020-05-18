import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import Resizable from 're-resizable';
import { useSelector, useDispatch } from 'react-redux';

import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';
import { useDebounceState } from 'hooks/redux/useDebounceState';
import { getQueryEngineId, sleep, enableResizable } from 'lib/utils';
import { getSelectedQuery } from 'lib/sql-helper/sql-lexer';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { searchText, replaceStringIndices } from 'lib/data-doc/search';

import { IStoreState, Dispatch } from 'redux/store/types';
import {
    queryEngineSelector,
    queryEngineByIdEnvSelector,
} from 'redux/queryEngine/selector';
import * as queryExecutionsAction from 'redux/queryExecutions/action';
import * as adhocQueryActions from 'redux/adhocQuery/action';
import * as dataDocActions from 'redux/dataDoc/action';

import { BindedQueryEditor } from 'components/QueryEditor/BindedQueryEditor';
import { CodeMirrorSearchHighlighter } from 'components/SearchAndReplace/CodeMirrorSearchHighlighter';
import {
    SearchAndReplace,
    ISearchAndReplaceHandles,
    ISearchAndReplaceProps,
} from 'components/SearchAndReplace/SearchAndReplace';
import {
    QueryRunButton,
    IQueryRunButtonHandles,
} from 'components/QueryRunButton/QueryRunButton';
import { QueryComposerExecution } from './QueryComposerExecution';
import { QueryEditor } from 'components/QueryEditor/QueryEditor';

import { FullHeight } from 'ui/FullHeight/FullHeight';
import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { Button } from 'ui/Button/Button';

import './QueryComposer.scss';

const useExecution = (dispatch: Dispatch) => {
    const executionId = useSelector(
        (state: IStoreState) => state.adhocQuery.executionId
    );
    const setExecutionId = useCallback(
        (id: number) => dispatch(adhocQueryActions.receiveAdhocExecutionId(id)),
        []
    );

    return { executionId, setExecutionId };
};

const useEngine = (dispatch: Dispatch) => {
    const engineId = useSelector(
        (state: IStoreState) => state.adhocQuery.engineId
    );
    const queryEngineById = useSelector(queryEngineByIdEnvSelector);
    const queryEngines = useSelector(queryEngineSelector);
    const defaultEngineId = useSelector((state: IStoreState) =>
        getQueryEngineId(
            state.user.computedSettings['default_query_engine'],
            queryEngines.map(({ id }) => id)
        )
    );
    const setEngineId = useCallback(
        (id: number) => dispatch(adhocQueryActions.receiveAdhocEngineId(id)),
        []
    );

    const actualEngineId =
        engineId != null && engineId in queryEngineById
            ? engineId
            : defaultEngineId;
    const engine = queryEngineById[actualEngineId];

    return {
        engine,
        setEngineId,
        queryEngines,
        queryEngineById,
    };
};

const useQuery = (dispatch: Dispatch) => {
    const reduxQuery = useSelector(
        (state: IStoreState) => state.adhocQuery.query
    );
    const setReduxQuery = useCallback(
        (newQuery: string) =>
            dispatch(adhocQueryActions.receiveAdhocQuery(newQuery)),
        []
    );
    const [query, setQuery] = useDebounceState(reduxQuery, setReduxQuery, 500);
    return { query, setQuery };
};

const useQueryComposerSearchAndReplace = (
    query: string,
    setQuery: (s: string) => any,
    searchAndReplaceRef: React.MutableRefObject<ISearchAndReplaceHandles>
): ISearchAndReplaceProps => {
    const getSearchResults = useCallback(
        (searchString: string, searchOptions: ISearchOptions) =>
            searchText(query, searchString, searchOptions),
        [query]
    );
    const replace = useCallback(
        (searchResultsToReplace: ISearchResult[], replaceString: string) => {
            setQuery(
                replaceStringIndices(
                    query,
                    searchResultsToReplace.map((r) => [r.from, r.to]),
                    replaceString
                )
            );
        },
        [query]
    );
    const jumpToResult = useCallback(
        (ignore: ISearchResult) => Promise.resolve(),
        []
    );

    useEffect(() => {
        searchAndReplaceRef.current?.performSearch();
    }, [query]);

    return {
        getSearchResults,
        replace,
        jumpToResult,
    };
};

export const QueryComposer: React.FC<{}> = () => {
    const dispatch: Dispatch = useDispatch();
    const { query, setQuery } = useQuery(dispatch);
    const { engine, setEngineId, queryEngines, queryEngineById } = useEngine(
        dispatch
    );
    const { executionId, setExecutionId } = useExecution(dispatch);
    const queryEditorRef = useRef<QueryEditor>(null);
    const runButtonRef = useRef<IQueryRunButtonHandles>(null);
    const searchAndReplaceRef = useRef<ISearchAndReplaceHandles>(null);

    const clickOnRunButton = useCallback(() => {
        if (runButtonRef.current) {
            runButtonRef.current.clickRunButton();
        }
    }, [runButtonRef.current]);
    const handleFormatQuery = useCallback(() => {
        if (queryEditorRef.current) {
            queryEditorRef.current.formatQuery();
        }
    }, [queryEditorRef.current]);
    const handleCreateDataDoc = useCallback(async () => {
        let dataDoc = null;
        const queryString = query;
        if (executionId) {
            dataDoc = await dispatch(
                dataDocActions.createDataDocFromAdhoc(
                    executionId,
                    engine.id,
                    queryString
                )
            );
        } else {
            const cell = {
                type: 'query',
                context: queryString,
                meta: { engine: engine.id },
            };
            dataDoc = await dispatch(dataDocActions.createDataDoc([cell]));
        }
        navigateWithinEnv(`/datadoc/${dataDoc.id}/`);
    }, [executionId, query]);

    const searchAndReplaceProps = useQueryComposerSearchAndReplace(
        query,
        setQuery,
        searchAndReplaceRef
    );

    const handleRunQuery = React.useCallback(async () => {
        // Just to throttle to prevent double running
        await sleep(250);

        const selectedRange = queryEditorRef.current?.getEditorSelection();

        const { id } = await dispatch(
            queryExecutionsAction.createQueryExecution(
                getSelectedQuery(query, selectedRange),
                engine?.id
            )
        );

        setExecutionId(id);
    }, [queryEditorRef.current, query, engine]);
    const keyMap = useMemo(
        () => ({
            'Shift-Enter': clickOnRunButton,
        }),
        [clickOnRunButton]
    );

    const editorDOM = (
        <>
            <BindedQueryEditor
                ref={queryEditorRef}
                value={query}
                lineWrapping={true}
                onChange={setQuery}
                keyMap={keyMap}
                height="full"
                engine={engine}
            />
            <CodeMirrorSearchHighlighter
                editor={queryEditorRef.current?.getEditor()}
                cellId={undefined}
            />
        </>
    );

    const executionDOM = executionId != null && (
        <Resizable
            defaultSize={{
                width: '100%',
                height: `300px`,
            }}
            enable={enableResizable({ top: true, bottom: true })}
            minHeight={200}
        >
            <div className="query-execution-wrapper">
                <div className="right-align">
                    <IconButton icon="x" onClick={() => setExecutionId(null)} />
                </div>
                <QueryComposerExecution id={executionId} />
            </div>
        </Resizable>
    );

    const contentDOM = (
        <div className="QueryComposer-content-editor">
            <div className="query-editor-wrapper">
                <SearchAndReplace
                    ref={searchAndReplaceRef}
                    {...searchAndReplaceProps}
                >
                    {editorDOM}
                </SearchAndReplace>
            </div>
            {executionDOM}
        </div>
    );

    const queryRunDOM = (
        <div>
            <QueryRunButton
                ref={runButtonRef}
                queryEngineById={queryEngineById}
                queryEngines={queryEngines}
                engineId={engine?.id}
                onEngineIdSelect={setEngineId}
                onRunClick={handleRunQuery}
            />
        </div>
    );

    const headerDOM = (
        <div className="QueryComposer-header">
            <div className="QueryComposer-header-vertical">
                <Level>
                    <LevelItem>
                        <Button
                            icon="edit-3"
                            title="Format"
                            onClick={handleFormatQuery}
                        />
                        <Button
                            icon="delete"
                            title="Clear"
                            onClick={() => setQuery('')}
                        />
                        <Button
                            icon="plus"
                            title="Create DataDoc"
                            onClick={handleCreateDataDoc}
                        />
                    </LevelItem>
                    <LevelItem>{queryRunDOM}</LevelItem>
                </Level>
            </div>
        </div>
    );

    return (
        <FullHeight flex={'column'} className="QueryComposer">
            {headerDOM}
            {contentDOM}
        </FullHeight>
    );
};
