import toast from 'react-hot-toast';
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

import { IQueryEngine } from 'const/queryEngine';
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
import { UDFForm } from 'components/UDFForm/UDFForm';

import { useBrowserTitle } from 'hooks/useBrowserTitle';

import { FullHeight } from 'ui/FullHeight/FullHeight';
import { IconButton } from 'ui/Button/IconButton';
import { Level, LevelItem } from 'ui/Level/Level';
import { Button } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';

import './QueryComposer.scss';
import { doesLanguageSupportUDF } from 'lib/utils/udf';

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
        [environmentId, dispatch]
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
        [environmentId]
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
        [query, setQuery]
    );

    const jumpToResult = useCallback(
        (_ignore: ISearchResult) => Promise.resolve(),
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
    }, []);

    const handleFocusEditor = useCallback(() => {
        if (queryEditorRef.current) {
            queryEditorRef.current.getEditor()?.focus();
        }
    }, []);

    useEffect(() => {
        handleFocusEditor();
    }, []);

    return {
        queryEditorRef,
        handleFormatQuery,
    };
}

function useKeyMap(
    clickOnRunButton: () => void,
    queryEngines: IQueryEngine[],
    setEngineId: (id: number) => void
) {
    return useMemo(() => {
        const keyMap = {
            [KeyMap.queryEditor.runQuery.key]: clickOnRunButton,
        };

        for (const [index, engine] of queryEngines.entries()) {
            const key = index + 1;
            if (key > 9) {
                // We have exhausted all number keys on the keyboard
                break;
            }
            keyMap[
                KeyMap.queryEditor.changeEngine.key + '-' + String(key)
            ] = () => setEngineId(engine.id);
        }

        return keyMap;
    }, [clickOnRunButton, queryEngines, setEngineId]);
}

const QueryComposer: React.FC = () => {
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

    const canShowUDFForm = useMemo(
        () => doesLanguageSupportUDF(engine.language),
        [engine.language]
    );
    const [showUDFForm, setShowUDFForm] = useState(false);

    const runButtonRef = useRef<IQueryRunButtonHandles>(null);
    const clickOnRunButton = useCallback(() => {
        if (runButtonRef.current) {
            runButtonRef.current.clickRunButton();
        }
    }, []);

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
    }, [executionId, query, engine.id]);

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
    }, [query, engine]);

    const keyMap = useKeyMap(clickOnRunButton, queryEngines, setEngineId);

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
                allowFullScreen
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

    const udfModalDOM = showUDFForm && (
        <Modal
            title="Insert User Defined Function"
            onHide={() => setShowUDFForm(false)}
        >
            <UDFForm
                onConfirm={(udfScript) => {
                    setQuery(udfScript + '\n\n' + query);
                    setShowUDFForm(false);
                    toast('UDF Added!');
                }}
                engineLanguage={engine.language}
            />
        </Modal>
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
            {udfModalDOM}
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
                    <LevelItem>
                        {canShowUDFForm && (
                            <Button
                                icon="plus"
                                title="Add UDF"
                                aria-label="Add New User Defined Function"
                                data-balloon-pos="left"
                                onClick={() => setShowUDFForm(true)}
                            />
                        )}

                        {queryRunDOM}
                    </LevelItem>
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

export default QueryComposer;
