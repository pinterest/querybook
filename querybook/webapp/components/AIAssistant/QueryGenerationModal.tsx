import { uniq } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';

import { QueryEngineSelector } from 'components/QueryRunButton/QueryRunButton';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryEngine } from 'const/queryEngine';
import { useAISocket } from 'hooks/useAISocket';
import { trackClick } from 'lib/analytics';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { trimSQLQuery } from 'lib/stream';
import { matchKeyPress } from 'lib/utils/keyboard';
import { analyzeCode } from 'lib/web-worker';
import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { StyledText } from 'ui/StyledText/StyledText';
import { Tag } from 'ui/Tag/Tag';

import { TableSelector } from './TableSelector';
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
        if (!!query) {
            analyzeCode(query, 'autocomplete', language).then(
                (codeAnalysis) => {
                    const tableReferences: TableToken[] = [].concat.apply(
                        [],
                        Object.values(codeAnalysis?.lineage.references ?? {})
                    );
                    setTables(
                        tableReferences.map(
                            ({ schema, name }) => `${schema}.${name}`
                        )
                    );
                }
            );
        }
    }, [query, language]);

    return tables;
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

    const onData = useCallback(({ type, data }) => {
        if (type === 'tables') {
            setTables(uniq([...tables, ...data]));
        } else {
            setStreamData(data);
        }
    }, []);

    const socket = useAISocket(AICommandType.TEXT_TO_SQL, onData);

    useEffect(() => {
        if (!socket.loading) {
            setTables(uniq([...tablesInQuery, ...tables]));
        }
    }, [tablesInQuery, socket.loading]);

    const { explanation, query: rawNewQuery, data } = streamData;

    useEffect(() => {
        setNewQuery(trimSQLQuery(rawNewQuery));
    }, [rawNewQuery]);

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (
                !socket.loading &&
                matchKeyPress(event, 'Enter') &&
                !event.shiftKey
            ) {
                socket.emit({
                    query_engine_id: engineId,
                    tables: tables,
                    question: question,
                    original_query: query,
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
            }
        },
        [engineId, question, tables, query, socket.emit, socket.loading]
    );

    const questionBarDOM = (
        <div className="question-bar">
            <span className="stars-icon">
                <Icon name={socket.loading ? 'Loading' : 'Stars'} size={18} />
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
                disabled={socket.loading}
                transparent
            />
            {socket.loading && (
                <Button
                    title="Stop Generating"
                    color="light"
                    onClick={socket.cancel}
                    className="mr8"
                />
            )}
        </div>
    );

    const bottomDOM = newQuery && !socket.loading && (
        <div className="right-align mb16">
            <Button
                title="Cancel"
                onClick={() => {
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
                socket.cancel();
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
                                showTablePopoverTooltip
                            />
                        </div>
                    </div>
                </div>

                {questionBarDOM}
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
                                        onClick={() => {
                                            onUpdateQuery(newQuery, false);
                                            setTextToSQLMode(
                                                TextToSQLMode.EDIT
                                            );
                                            setQuestion('');
                                            setNewQuery('');
                                            trackClick({
                                                component:
                                                    ComponentType.AI_ASSISTANT,
                                                element:
                                                    ElementType.QUERY_GENERATION_KEEP_BUTTON,
                                                aux: {
                                                    mode: textToSQLMode,
                                                    question,
                                                    tables,
                                                },
                                            });
                                        }}
                                        color="confirm"
                                    />
                                </div>
                            }
                            disableHighlight={socket.loading}
                            hideEmptyQuery={true}
                        />
                    </div>
                )}
            </div>
        </Modal>
    );
};
