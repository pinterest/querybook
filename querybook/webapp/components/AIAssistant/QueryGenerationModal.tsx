import { uniq } from 'lodash';
import React, { useCallback, useEffect, useState } from 'react';

import { QueryEngineSelector } from 'components/QueryRunButton/QueryRunButton';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryEngine } from 'const/queryEngine';
import { StreamStatus, useStream } from 'hooks/useStream';
import { trackClick } from 'lib/analytics';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { matchKeyPress } from 'lib/utils/keyboard';
import { analyzeCode } from 'lib/web-worker';
import { Button } from 'ui/Button/Button';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Icon } from 'ui/Icon/Icon';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { StyledText } from 'ui/StyledText/StyledText';

import { TableSelector } from './TableSelector';
import { TextToSQLMode, TextToSQLModeSelector } from './TextToSQLModeSelector';

import './QueryGenerationModal.scss';

interface IProps {
    dataCellId: number;
    query: string;
    engineId: number;
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    onUpdateQuery?: (query: string) => void;
    onUpdateEngineId: (engineId: number) => void;
    onHide: () => void;
}

const useTablesInQuery = (query, language) => {
    const [tables, setTables] = useState<string[]>([]);

    useEffect(() => {
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

export const QueryGenerationModal = ({
    dataCellId,
    query = '',
    engineId,
    queryEngines,
    queryEngineById,
    onUpdateQuery,
    onUpdateEngineId,
    onHide,
}: IProps) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const tablesInQuery = useTablesInQuery(
        query,
        queryEngineById[engineId]?.language
    );
    const [question, setQuestion] = useState<string>('');
    const [tables, setTables] = useState(tablesInQuery);
    const [textToSQLMode, setTextToSQLMode] = useState(
        !!query ? TextToSQLMode.EDIT : TextToSQLMode.GENERATE
    );

    useEffect(() => {
        setTables(uniq([...tablesInQuery, ...tables]));
    }, [tablesInQuery]);

    const { streamStatus, startStream, streamData } = useStream(
        '/ds/ai/generate_query/',
        {
            query_engine_id: engineId,
            tables: tables,
            question: question,
            data_cell_id:
                textToSQLMode === TextToSQLMode.EDIT ? dataCellId : undefined,
        }
    );

    const { explanation, query: newQuery } = streamData;

    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (matchKeyPress(event, 'Enter')) {
                startStream();
                inputRef.current.blur();
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
        [startStream]
    );

    const questionBarDOM = (
        <div className="question-bar">
            <span className="stars-icon">
                <Icon
                    name={
                        streamStatus === StreamStatus.STREAMING
                            ? 'Loading'
                            : 'Stars'
                    }
                    size={18}
                />
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
            <DebouncedInput
                debounceTime={0}
                debounceMethod="debounce"
                onChange={setQuestion}
                value={question}
                transparent={false}
                inputProps={{
                    placeholder:
                        textToSQLMode === TextToSQLMode.GENERATE
                            ? 'Ask AI to generate a new query'
                            : 'Ask AI to edit the query',
                    type: 'text',
                    onKeyDown,
                    ref: inputRef,
                    autoFocus: true,
                }}
            />
        </div>
    );

    const bottomDOM = newQuery && streamStatus === StreamStatus.FINISHED && (
        <div className="right-align mb16">
            <Button
                title="Cancel"
                color="cancel"
                onClick={() => {
                    onHide();
                }}
            />
            <Button
                title="Apply"
                onClick={() => {
                    onUpdateQuery(newQuery);
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
        </div>
    );

    return (
        <Modal
            onHide={onHide}
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
                        Please select query engine and table(s) to get started
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

                {tables.length > 0 && (
                    <>
                        {questionBarDOM}
                        {explanation && (
                            <div className="mt12">{explanation}</div>
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
                                    toQueryTitle="New Query"
                                    disableHighlight={
                                        streamStatus === StreamStatus.STREAMING
                                    }
                                    hideEmptyQuery={true}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};
