import React, {
    useRef,
    useCallback,
    useMemo,
    useEffect,
    useState,
} from 'react';
import Resizable from 're-resizable';
import { useSelector, useDispatch } from 'react-redux';

import KeyMap from 'const/keyMap';
import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';
import { useDebounceState } from 'hooks/redux/useDebounceState';
import { getQueryEngineId, sleep, enableResizable } from 'lib/utils';
import { getSelectedQuery, IRange } from 'lib/sql-helper/sql-lexer';
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

import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
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

import { useBrowserTitle } from 'hooks/useBrowserTitle';

import { FullHeight } from 'ui/FullHeight/FullHeight';
import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { Button } from 'ui/Button/Button';

import './QueryComposer.scss';

const useExecution = (dispatch: Dispatch, environmentId: number) => {
    const executionId = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.executionId
    );
    const setExecutionId = useCallback(
        (id: number) =>
            dispatch(
                adhocQueryActions.receiveAdhocQuery(
                    { executionId: id },
                    environmentId
                )
            ),
        []
    );

    return { executionId, setExecutionId };
};

const useEngine = (dispatch: Dispatch, environmentId: number) => {
    const engineId = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.engineId
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
        (id: number) =>
            dispatch(
                adhocQueryActions.receiveAdhocQuery(
                    { engineId: id },
                    environmentId
                )
            ),
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

const useQuery = (dispatch: Dispatch, environmentId: number) => {
    const reduxQuery = useSelector(
        (state: IStoreState) => state.adhocQuery[environmentId]?.query ?? ''
    );
    const setReduxQuery = useCallback(
        (newQuery: string) =>
            dispatch(
                adhocQueryActions.receiveAdhocQuery(
                    { query: newQuery },
                    environmentId
                )
            ),
        []
    );
    const [query, setQuery] = useDebounceState(reduxQuery, setReduxQuery, 500);
    return { query, setQuery };
};

const useQueryComposerSearchAndReplace = (
    query: string,
    setQuery: (s: string) => any
) => {
    const searchAndReplaceRef = useRef<ISearchAndReplaceHandles>(null);

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

    const searchAndReplaceProps: ISearchAndReplaceProps = {
        getSearchResults,
        replace,
        jumpToResult,
    };

    return {
        searchAndReplaceProps,
        searchAndReplaceRef,
    };
};

function useQueryEditorHelpers() {
    const queryEditorRef = useRef<QueryEditor>(null);
    const handleFormatQuery = useCallback(() => {
        if (queryEditorRef.current) {
            queryEditorRef.current.formatQuery();
        }
    }, [queryEditorRef.current]);

    const handleFocusEditor = useCallback(() => {
        if (queryEditorRef.current) {
            queryEditorRef.current.getEditor()?.focus();
        }
    }, [queryEditorRef.current]);

    useEffect(() => {
        handleFocusEditor();
    }, []);

    return {
        queryEditorRef,
        handleFormatQuery,
    };
}

export const QueryComposer: React.FC = () => {
    useBrowserTitle('Adhoc Query');

    const environmentId = useSelector(
        (state: IStoreState) => state.environment.currentEnvironmentId
    );
    const dispatch: Dispatch = useDispatch();
    const { query, setQuery } = useQuery(dispatch, environmentId);
    const { engine, setEngineId, queryEngines, queryEngineById } = useEngine(
        dispatch,
        environmentId
    );
    const { executionId, setExecutionId } = useExecution(
        dispatch,
        environmentId
    );

    const {
        searchAndReplaceProps,
        searchAndReplaceRef,
    } = useQueryComposerSearchAndReplace(query, setQuery);

    const runButtonRef = useRef<IQueryRunButtonHandles>(null);
    const clickOnRunButton = useCallback(() => {
        if (runButtonRef.current) {
            runButtonRef.current.clickRunButton();
        }
    }, [runButtonRef.current]);

    const { queryEditorRef, handleFormatQuery } = useQueryEditorHelpers();

    const handleCreateDataDoc = useCallback(async () => {
        let dataDoc = null;
        if (executionId) {
            dataDoc = await dispatch(
                dataDocActions.createDataDocFromAdhoc(
                    executionId,
                    engine.id,
                    query
                )
            );
        } else {
            const cell = {
                type: 'query',
                context: query,
                meta: { engine: engine.id },
            };
            dataDoc = await dispatch(dataDocActions.createDataDoc([cell]));
        }
        navigateWithinEnv(`/datadoc/${dataDoc.id}/`);
    }, [executionId, query]);

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
            [KeyMap.queryEditor.runQuery.key]: clickOnRunButton,
        }),
        [clickOnRunButton]
    );

    const [editorHasSelection, setEditorHasSelection] = useState(false);
    const handleEditorSelection = React.useCallback(
        (_: string, range: IRange) => {
            setEditorHasSelection(!!range);
        },
        []
    );

    const editorDOM = (
        <>
            <BoundQueryEditor
                ref={queryEditorRef}
                value={query}
                lineWrapping={true}
                onChange={setQuery}
                keyMap={keyMap}
                height="full"
                engine={engine}
                onSelection={handleEditorSelection}
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
                hasSelection={editorHasSelection}
                runButtonTooltipPos={'left'}
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
                            onClick={() => {
                                setQuery('');
                                setExecutionId(null);
                            }}
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
