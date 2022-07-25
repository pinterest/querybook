import clsx from 'clsx';
import Resizable from 're-resizable';
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';

import { DataDocTemplateInfoButton } from 'components/DataDocTemplateButton/DataDocTemplateInfoButton';
import { DataDocTemplateVarForm } from 'components/DataDocTemplateButton/DataDocTemplateVarForm';
import { BoundQueryEditor } from 'components/QueryEditor/BoundQueryEditor';
import { QueryEditor } from 'components/QueryEditor/QueryEditor';
import {
    IQueryRunButtonHandles,
    QueryRunButton,
} from 'components/QueryRunButton/QueryRunButton';
import {
    ISearchAndReplaceHandles,
    ISearchAndReplaceProps,
    SearchAndReplace,
} from 'components/SearchAndReplace/SearchAndReplace';
import { TemplatedQueryView } from 'components/TemplateQueryView/TemplatedQueryView';
import { UDFForm } from 'components/UDFForm/UDFForm';
import KeyMap from 'const/keyMap';
import { IQueryEngine } from 'const/queryEngine';
import { ISearchOptions, ISearchResult } from 'const/searchAndReplace';
import { useDebounceState } from 'hooks/redux/useDebounceState';
import { useBrowserTitle } from 'hooks/useBrowserTitle';
import { replaceStringIndices, searchText } from 'lib/data-doc/search';
import { sendConfirm } from 'lib/querybookUI';
import { getDroppedTables } from 'lib/sql-helper/sql-checker';
import { getSelectedQuery, IRange } from 'lib/sql-helper/sql-lexer';
import { renderTemplatedQuery } from 'lib/templated-query';
import { enableResizable, getQueryEngineId, sleep } from 'lib/utils';
import { formatError } from 'lib/utils/error';
import { navigateWithinEnv } from 'lib/utils/query-string';
import { doesLanguageSupportUDF } from 'lib/utils/udf';
import * as adhocQueryActions from 'redux/adhocQuery/action';
import * as dataDocActions from 'redux/dataDoc/action';
import {
    queryEngineByIdEnvSelector,
    queryEngineSelector,
} from 'redux/queryEngine/selector';
import * as queryExecutionsAction from 'redux/queryExecutions/action';
import { Dispatch, IStoreState } from 'redux/store/types';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Content } from 'ui/Content/Content';
import { Dropdown } from 'ui/Dropdown/Dropdown';
import { FullHeight } from 'ui/FullHeight/FullHeight';
import { Level, LevelItem } from 'ui/Level/Level';
import { IListMenuItem, ListMenu } from 'ui/Menu/ListMenu';
import { Modal } from 'ui/Modal/Modal';

import { QueryComposerExecution } from './QueryComposerExecution';

import './QueryComposer.scss';

const QUERY_EXECUTION_HEIGHT = 300;

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

const useTemplatedVariables = (dispatch: Dispatch, environmentId: number) => {
    const templatedVariables = useSelector(
        (state: IStoreState) =>
            state.adhocQuery[environmentId]?.templatedVariables ?? {}
    );
    const setTemplatedVariables = useCallback(
        (newVariables: Record<string, any>) =>
            dispatch(
                adhocQueryActions.receiveAdhocQuery(
                    { templatedVariables: newVariables },
                    environmentId
                )
            ),
        [environmentId]
    );

    return { templatedVariables, setTemplatedVariables };
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
            keyMap[KeyMap.queryEditor.changeEngine.key + '-' + String(key)] =
                () => setEngineId(engine.id);
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

    const [resultsCollapsed, setResultsCollapsed] = useState(false);

    const { searchAndReplaceProps, searchAndReplaceRef } =
        useQueryComposerSearchAndReplace(query, setQuery);

    const canShowUDFForm = useMemo(
        () => doesLanguageSupportUDF(engine.language),
        [engine.language]
    );
    const [showUDFForm, setShowUDFForm] = useState(false);
    const [showTemplateForm, setShowTemplateForm] = useState(false);
    const { templatedVariables, setTemplatedVariables } = useTemplatedVariables(
        dispatch,
        environmentId
    );
    const [showRenderedTemplateModal, setShowRenderedTemplateModal] =
        useState(false);

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
                    query,
                    templatedVariables
                )
            );
        } else {
            const cell = {
                type: 'query',
                context: query,
                meta: { engine: engine.id },
            };
            dataDoc = await dispatch(
                dataDocActions.createDataDoc([cell], templatedVariables)
            );
        }
        navigateWithinEnv(`/datadoc/${dataDoc.id}/`);
    }, [executionId, query, engine.id, templatedVariables]);

    const getCurrentSelectedQuery = useCallback(async () => {
        const selectedRange = queryEditorRef.current?.getEditorSelection();
        try {
            const rawQuery = getSelectedQuery(query, selectedRange);
            return await renderTemplatedQuery(
                rawQuery,
                templatedVariables,
                engine?.id
            );
        } catch (e) {
            toast.error(
                <div>
                    <p>Failed to templatize query. </p>
                    <p>{formatError(e)}</p>
                </div>,
                {
                    duration: 5000,
                }
            );
        }
    }, [query, engine]);

    const handleRunQuery = React.useCallback(async () => {
        // Just to throttle to prevent double running
        await sleep(250);

        const selectedQuery = await getCurrentSelectedQuery();
        const runQuery = async () => {
            const { id } = await dispatch(
                queryExecutionsAction.createQueryExecution(
                    selectedQuery,
                    engine?.id
                )
            );

            setExecutionId(id);
            setResultsCollapsed(false);
        };

        if (selectedQuery) {
            const droppedTables = getDroppedTables(selectedQuery);
            if (droppedTables.length > 0) {
                return new Promise((resolve, reject) => {
                    sendConfirm({
                        header: 'Dropping Tables?',
                        message: (
                            <Content>
                                <div>Your query is going to drop</div>
                                <ul>
                                    {droppedTables.map((t) => (
                                        <li key={t}>{t}</li>
                                    ))}
                                </ul>
                            </Content>
                        ),
                        onConfirm: () => runQuery().then(resolve, reject),
                        onDismiss: () => resolve(null),
                        confirmText: 'Continue Execution',
                    });
                });
            } else {
                return runQuery();
            }
        }
    }, [query, templatedVariables, engine]);

    const keyMap = useKeyMap(clickOnRunButton, queryEngines, setEngineId);

    const [editorHasSelection, setEditorHasSelection] = useState(false);
    const handleEditorSelection = React.useCallback(
        (_: string, range: IRange) => {
            setEditorHasSelection(!!range);
        },
        []
    );

    const scrollToCollapseExecution = React.useCallback(
        (event, direction, elementRef) => {
            if (
                direction === 'top' &&
                elementRef.clientHeight < QUERY_EXECUTION_HEIGHT / 3
            ) {
                setResultsCollapsed(true);
            }
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

    const executionDOM = () => {
        if (!executionId) {
            return null;
        } else if (resultsCollapsed) {
            const collapseButton = (
                <div
                    className="flex-center"
                    onClick={() => setResultsCollapsed(false)}
                    aria-label="Show Query Execution"
                    data-balloon-pos="top"
                >
                    <IconButton icon="ChevronUp" noPadding />
                </div>
            );
            return collapseButton;
        }

        return (
            <Resizable
                defaultSize={{
                    width: '100%',
                    height: `${QUERY_EXECUTION_HEIGHT}px`,
                }}
                enable={enableResizable({ top: true, bottom: true })}
                onResize={scrollToCollapseExecution}
            >
                <div className="query-execution-wrapper">
                    <div
                        className="hide-execution flex-center pt8 mb4"
                        onClick={() => setResultsCollapsed(true)}
                        aria-label="Collapse Query Execution"
                        data-balloon-pos="bottom"
                    >
                        <IconButton icon="ChevronDown" noPadding />
                    </div>
                    <QueryComposerExecution id={executionId} />
                </div>
            </Resizable>
        );
    };

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

    const queryEditorWrapperClassname = clsx({
        'query-editor-wrapper': true,
        mb16: executionId != null,
    });

    const contentDOM = (
        <div className="QueryComposer-content-editor">
            <div className={queryEditorWrapperClassname}>
                <SearchAndReplace
                    ref={searchAndReplaceRef}
                    {...searchAndReplaceProps}
                >
                    {editorDOM}
                </SearchAndReplace>
            </div>
            {executionDOM()}
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
                runButtonTooltipPos={'down'}
            />
        </div>
    );

    const templatedModalDOM = showTemplateForm && (
        <Modal
            onHide={() => {
                setShowTemplateForm(false);
            }}
            title="Variables"
            topDOM={<DataDocTemplateInfoButton />}
        >
            <DataDocTemplateVarForm
                isEditable={true}
                templatedVariables={templatedVariables}
                onSave={(meta) => {
                    setTemplatedVariables(meta);
                    setShowTemplateForm(false);
                    toast.success('Variables saved!');
                }}
            />
        </Modal>
    );

    const templatedQueryViewModalDOM = showRenderedTemplateModal && (
        <Modal
            onHide={() => setShowRenderedTemplateModal(false)}
            title="Rendered Templated Query"
        >
            <TemplatedQueryView
                query={query}
                templatedVariables={templatedVariables}
                engineId={engine.id}
                onRunQueryClick={() => {
                    setShowRenderedTemplateModal(false);
                    handleRunQuery();
                }}
            />
        </Modal>
    );

    const getAdditionalDropDownButtonDOM = () => {
        const additionalButtons: IListMenuItem[] = [
            {
                name: 'Template Config',
                onClick: () => setShowTemplateForm(true),
                icon: 'Code',
                tooltip: 'Set Variables',
                tooltipPos: 'right',
            },
            {
                name: 'Render Template',
                onClick: () => setShowRenderedTemplateModal(true),
                icon: 'Eye',
                tooltip: 'Show the rendered templated query',
                tooltipPos: 'right',
            },
            {
                name: 'Create DataDoc',
                onClick: handleCreateDataDoc,
                icon: 'Plus',
                tooltip: 'Create datadoc from the adhoc query',
                tooltipPos: 'right',
            },
        ];

        if (canShowUDFForm) {
            additionalButtons.push({
                name: 'Add UDF',
                onClick: () => setShowUDFForm(true),
                icon: 'Plus',
                tooltip: 'Add New User Defined Function',
                tooltipPos: 'right',
            });
        }

        return (
            <>
                <Dropdown
                    menuIcon="MoreVertical"
                    className="query-cell-additional-dropdown"
                >
                    <ListMenu items={additionalButtons} />
                </Dropdown>
                {templatedModalDOM}
                {templatedQueryViewModalDOM}
            </>
        );
    };

    const headerDOM = (
        <div className="QueryComposer-header">
            <div className="QueryComposer-header-vertical">
                <Level>
                    <LevelItem>
                        <Button
                            icon="Edit3"
                            title="Format"
                            onClick={handleFormatQuery}
                            theme="text"
                        />
                        <Button
                            icon="Delete"
                            title="Clear"
                            onClick={() => {
                                setQuery('');
                                setExecutionId(null);
                            }}
                            theme="text"
                        />
                        {getAdditionalDropDownButtonDOM()}
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

export default QueryComposer;
