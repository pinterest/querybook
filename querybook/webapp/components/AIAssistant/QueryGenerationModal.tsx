import { uniq } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';

import { QueryEngineSelector } from 'components/QueryRunButton/QueryRunButton';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryEngine } from 'const/queryEngine';
import { SurveySurfaceType } from 'const/survey';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';
import { useAISocket } from 'hooks/useAISocket';
import { trackClick } from 'lib/analytics';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { matchKeyPress } from 'lib/utils/keyboard';
import { analyzeCode } from 'lib/web-worker';
import { Button } from 'ui/Button/Button';
import { Checkbox } from 'ui/Checkbox/Checkbox';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import { TableSelector } from './TableSelector';
import { TableTag } from './TableTag';
import { TextToSQLMode, TextToSQLModeSelector } from './TextToSQLModeSelector';

import './QueryGenerationModal.scss';

interface IProps {
    query: string;
    engineId: number;
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    onUpdateQuery: (query: string, run: boolean) => void;
    onUpdateEngineId: (engineId: number) => void;
    onHide: () => void;
}

const useTablesInQuery = (query, language) => {
    const [tables, setTables] = useState<string[]>([]);

    useEffect(() => {
        if (!query) {
            return;
        }

        analyzeCode(query, 'autocomplete', language).then((codeAnalysis) => {
            const tableReferences: TableToken[] = [].concat.apply(
                [],
                Object.values(codeAnalysis?.lineage.references ?? {})
            );
            setTables(
                tableReferences.map(({ schema, name }) => `${schema}.${name}`)
            );
        });
    }, [query, language]);

    return tables;
};

const useSQLGeneration = (
    onData: (data: { type?: string; data: { [key: string]: string } }) => void
): {
    generating: boolean;
    generateSQL: (data: {
        query_engine_id: number;
        tables: string[];
        question: string;
        original_query: string;
    }) => void;
    cancelGeneration: () => void;
} => {
    const socket = useAISocket(AICommandType.TEXT_TO_SQL, onData);
    return {
        generating: socket.loading,
        generateSQL: socket.emit,
        cancelGeneration: socket.cancel,
    };
};

export const QueryGenerationModal = ({
    query = '',
    engineId,
    queryEngines,
    queryEngineById,
    onUpdateQuery,
    onUpdateEngineId,
    onHide,
}: IProps) => {
    const tablesInQuery = useTablesInQuery(
        query,
        queryEngineById[engineId]?.language
    );
    const [question, setQuestion] = useState<string>('');
    const [tables, setTables] = useState(tablesInQuery);
    const [textToSQLMode, setTextToSQLMode] = useState(
        !!query ? TextToSQLMode.EDIT : TextToSQLMode.GENERATE
    );
    const [newQuery, setNewQuery] = useState<string>('');
    const [streamData, setStreamData] = useState<{ [key: string]: string }>({});
    const [foundTables, setFoundTables] = useState<string[]>([]);

    const onData = useCallback(({ type, data }) => {
        if (type === 'tables') {
            setTables([...data.slice(0, 1)]); // select the first table by default
            setFoundTables(data);
        } else {
            setStreamData(data);
        }
    }, []);

    const { generating, generateSQL, cancelGeneration } =
        useSQLGeneration(onData);

    useEffect(() => {
        if (!generating) {
            setTables((tables) => uniq([...tablesInQuery, ...tables]));
        }
    }, [tablesInQuery, generating]);

    const { explanation, query: rawNewQuery, data } = streamData;

    useEffect(() => {
        if (rawNewQuery) {
            setNewQuery(rawNewQuery);
        }
    }, [rawNewQuery]);

    const triggerSurvey = useSurveyTrigger();
    useEffect(() => {
        if (!newQuery || generating) {
            return;
        }
        triggerSurvey(SurveySurfaceType.TEXT_TO_SQL, {
            question,
            tables,
            query: newQuery,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newQuery, triggerSurvey, generating]);

    const onGenerate = useCallback(() => {
        setFoundTables([]);
        generateSQL({
            query_engine_id: engineId,
            tables,
            question,
            original_query: textToSQLMode === TextToSQLMode.EDIT ? query : null,
        });
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_GENERATION_BUTTON,
            aux: {
                mode: textToSQLMode,
                question,
                tables,
            },
        });
    }, [engineId, question, tables, query, generateSQL, trackClick]);

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (
                !generating &&
                matchKeyPress(event, 'Enter') &&
                !event.shiftKey
            ) {
                onGenerate();
            }
        },
        [onGenerate]
    );

    const handleKeepQuery = useCallback(() => {
        onUpdateQuery(newQuery, false);
        setTextToSQLMode(TextToSQLMode.EDIT);
        setQuestion('');
        setNewQuery('');
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_GENERATION_KEEP_BUTTON,
            aux: {
                mode: textToSQLMode,
                question,
                tables,
                query: newQuery,
            },
        });
    }, [newQuery, onUpdateQuery, textToSQLMode, question, tables]);

    const questionBarDOM = (
        <div className="question-bar">
            <span className="stars-icon">
                <Icon name={generating ? 'Loading' : 'Stars'} size={18} />
            </span>
            <div className="text2sql-mode">
                <TextToSQLModeSelector
                    selectedMode={textToSQLMode}
                    modes={
                        query
                            ? [TextToSQLMode.GENERATE, TextToSQLMode.EDIT]
                            : [TextToSQLMode.GENERATE]
                    }
                    onModeSelect={setTextToSQLMode}
                />
            </div>
            <ResizableTextArea
                value={question}
                onChange={setQuestion}
                className="question-text-area"
                placeholder={
                    textToSQLMode === TextToSQLMode.GENERATE
                        ? 'Ask AI to generate a new query'
                        : 'Ask AI to edit the query'
                }
                onKeyDown={onKeyDown}
                disabled={generating}
                transparent
            />
            {generating && (
                <Button
                    title="Stop Generating"
                    color="light"
                    onClick={cancelGeneration}
                    className="mr8"
                />
            )}
        </div>
    );

    const tablesDOM = foundTables.length > 0 && (
        <div className="mt12">
            <div>
                Please review the tables below that I found for your question.
                Select the tables you would like to use or you can also search
                for tables above.
            </div>
            <div className="mt8">
                {foundTables.map((table) => (
                    <div key={table} className="flex-row">
                        <Checkbox
                            value={tables.includes(table)}
                            onChange={(checked) =>
                                setTables((oldTables) =>
                                    checked
                                        ? uniq([...oldTables, table])
                                        : oldTables.filter((t) => t !== table)
                                )
                            }
                        />
                        <TableTag
                            metastoreId={queryEngineById[engineId].metastore_id}
                            tableName={table}
                        />
                    </div>
                ))}
            </div>
            <div className="mt8">
                <Button
                    title="Confirm & Generate SQL"
                    onClick={onGenerate}
                    color="confirm"
                    disabled={tables.length === 0}
                />
            </div>
        </div>
    );

    const bottomDOM = newQuery && !generating && (
        <div className="right-align mb16">
            <Button
                title="Cancel"
                onClick={() => {
                    if (newQuery) {
                        trackClick({
                            component: ComponentType.AI_ASSISTANT,
                            element: ElementType.QUERY_GENERATION_REJECT_BUTTON,
                            aux: {
                                mode: textToSQLMode,
                                question,
                                tables,
                                query: newQuery,
                            },
                        });
                    }
                    onHide();
                }}
            />
            <Button
                title="Apply"
                onClick={() => {
                    onUpdateQuery(newQuery, false);
                    setQuestion('');
                    trackClick({
                        component: ComponentType.AI_ASSISTANT,
                        element: ElementType.QUERY_GENERATION_APPLY_BUTTON,
                        aux: {
                            mode: textToSQLMode,
                            question,
                            tables,
                            query: newQuery,
                        },
                    });
                    onHide();
                }}
                color="confirm"
            />
            <Button
                title="Apply and Run"
                onClick={() => {
                    onUpdateQuery(newQuery, true);
                    setQuestion('');
                    trackClick({
                        component: ComponentType.AI_ASSISTANT,
                        element: ElementType.QUERY_GENERATION_APPLY_BUTTON,
                        aux: {
                            mode: textToSQLMode,
                            question,
                            tables,
                            query: newQuery,
                        },
                    });
                    onHide();
                }}
                color="accent"
            />
        </div>
    );

    return (
        <Modal
            onHide={() => {
                cancelGeneration();
                onHide();
            }}
            className="QueryGenerationModal"
            bottomDOM={bottomDOM}
        >
            <div>
                <Message
                    message="Note: This AI-powered query generation may not be 100% accurate. Please use your own judgement and verify the result."
                    type="warning"
                />
                <div
                    style={{
                        background: 'var(--bg-lightest)',
                        padding: 12,
                        borderRadius: 'var(--border-radius-sm)',
                    }}
                >
                    <StyledText size="small" weight="bold">
                        Please select query engine and table(s) to get started,
                        or AI will try the best to find the table(s) for you.
                    </StyledText>
                    <div className="flex-row-top mt8 gap8">
                        <QueryEngineSelector
                            queryEngineById={queryEngineById}
                            queryEngines={queryEngines}
                            engineId={engineId}
                            onEngineIdSelect={onUpdateEngineId}
                        />
                        <div style={{ flex: 1 }}>
                            <TableSelector
                                metastoreId={
                                    queryEngineById[engineId].metastore_id
                                }
                                tableNames={tables}
                                onTableNamesChange={setTables}
                                selectProps={{
                                    autoFocus: true,
                                }}
                                clearAfterSelect
                            />
                        </div>
                    </div>
                </div>

                {questionBarDOM}
                {tablesDOM}
                {(explanation || data) && (
                    <div className="mt12">{explanation || data}</div>
                )}

                {(query || newQuery) && (
                    <div className="mt12">
                        <QueryComparison
                            fromQuery={
                                textToSQLMode === TextToSQLMode.EDIT
                                    ? query
                                    : ''
                            }
                            toQuery={newQuery}
                            fromQueryTitle="Original Query"
                            toQueryTitle={
                                <div className="horizontal-space-between">
                                    {<Tag>New Query</Tag>}
                                    <Button
                                        title="Keep the query"
                                        onClick={handleKeepQuery}
                                        color="confirm"
                                    />
                                </div>
                            }
                            disableHighlight={generating}
                            hideEmptyQuery={true}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};
