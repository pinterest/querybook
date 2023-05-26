import React, { useState } from 'react';

import { QueryEngineSelector } from 'components/QueryRunButton/QueryRunButton';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { IQueryEngine } from 'const/queryEngine';
import { matchKeyPress } from 'lib/utils/keyboard';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Icon } from 'ui/Icon/Icon';
import { Modal } from 'ui/Modal/Modal';

import { AIMode, AIModeSelector } from './AIModeSelector';
import { TableSelector } from './TableSelector';

import './AIToolbar.scss';

interface IProps {
    query: string;
    engineId: number;
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    showDiff: boolean;
    setShowDiff: (showDiff: boolean) => any;
    onUpdateQuery?: (query: string) => void;
    onAccept?: (query: string) => void;
    onDiscard?: () => void;
    onUpdateEngineId: (engineId: number) => void;
}

export const AIView = ({
    query = '',
    engineId,
    queryEngines,
    queryEngineById,
    showDiff,
    setShowDiff,
    onUpdateQuery,
    onAccept,
    onDiscard,
    onUpdateEngineId,
}: IProps) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [show, setShow] = useState(false);
    const [question, setQuestion] = useState<string>('');
    const [isAsking, setIsAsking] = useState(false);
    const [newQuery, setNewQuery] = useState('');
    const [tables, setTables] = useState([]);
    const [aiMode, setAIMode] = useState(
        !!query ? AIMode.EDIT : AIMode.GENERATE
    );
    const [thinking, setThinking] = useState(false);

    const [confirmTables, setConfirmTables] = useState(false);
    const [suggestedTables, setSuggestedTables] = useState([]);

    const askAI = async () => {
        console.log('asking AI');
        // const needTitle = !query;
        setIsAsking(true);
        setNewQuery('');
        setThinking(true);
        setConfirmTables(false);
        const response = await fetch('/ds/ai/text2sql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                tables,
                query_engine_id: engineId,
            }),
        });
        // Create a new TextDecoder to decode the streamed response text
        const decoder = new TextDecoder();

        // Set up a new ReadableStream to read the response body
        const reader = response.body.getReader();
        let chunks = '';
        let returnType = null;
        // Read the response stream as chunks and append them to the chat log
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log(chunks);
                break;
            }
            chunks += decoder.decode(value);

            if (chunks.startsWith('###tables\n')) {
                setConfirmTables(true);
                returnType = 'tables';
                chunks = chunks.substring('###tables\n'.length);
                setThinking(false);
            } else if (chunks.startsWith('###query\n')) {
                console.log('returntype', chunks);
                returnType = 'query';
                chunks = chunks.substring('###query\n'.length);
                setThinking(false);
                setShowDiff(true);
            }
            if (returnType === 'tables') {
                setSuggestedTables(chunks.split('\n'));
            } else if (returnType === 'query') {
                setNewQuery(chunks);
            } else {
                setThinking(true);
            }
        }
        setIsAsking(false);
        setThinking(false);
    };

    const editQuery = async () => {
        setIsAsking(true);
        setNewQuery('');
        const response = await fetch('/ds/ai/edit_query_stream/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                query,
            }),
        });
        setShowDiff(true);
        // Create a new TextDecoder to decode the streamed response text
        const decoder = new TextDecoder();

        // Set up a new ReadableStream to read the response body
        const reader = response.body.getReader();
        let chunks = '';

        // Read the response stream as chunks and append them to the chat log
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            chunks += decoder.decode(value);
            setNewQuery(chunks);
        }
        setIsAsking(false);
    };

    const resetState = () => {
        setQuestion('');
        setNewQuery('');
        setShowDiff(false);
    };
    const onKeyDown = (event: React.KeyboardEvent) => {
        if (matchKeyPress(event, 'Enter')) {
            if (aiMode === AIMode.GENERATE) {
                askAI();
            } else {
                editQuery();
            }
            inputRef.current.blur();
        }
    };

    const suggestedTablesDOM = (
        <div>
            <div>Suggested Tables</div>
            {suggestedTables.map((table) => (
                <div key={table} className="flex-row">
                    <span>{table}</span>
                    <Button
                        title={tables.includes(table) ? 'Remove' : 'Add'}
                        onClick={() => {
                            if (tables.includes(table)) {
                                setTables(tables.filter((t) => t !== table));
                            } else {
                                setTables([...tables, table]);
                            }
                        }}
                    />
                </div>
            ))}
        </div>
    );

    return (
        <div className="ai-controls">
            <IconButton
                className="StarsIconButton"
                icon="Stars"
                size={18}
                tooltip="AI: generate/edit query"
                color={!query ? 'accent' : undefined}
                onClick={() => setShow(true)}
            />
            {show && (
                <Modal onHide={() => setShow(false)} className="ai-modal">
                    <div>
                        <div className="flex-row-top" style={{ gap: 8 }}>
                            <div className="sidebar">
                                <div className="horizontal-space-between">
                                    <div className="label">engine</div>
                                    <QueryEngineSelector
                                        queryEngineById={queryEngineById}
                                        queryEngines={queryEngines}
                                        engineId={engineId}
                                        onEngineIdSelect={onUpdateEngineId}
                                    />
                                </div>
                                <TableSelector
                                    tableNames={tables}
                                    onTableNamesChange={setTables}
                                    selectProps={{
                                        autoFocus: true,
                                    }}
                                    clearAfterSelect
                                />
                            </div>
                            <div className="content">
                                <div className="AIToolbarV2">
                                    <span className="StarsIcon">
                                        <Icon
                                            name={
                                                isAsking ? 'Loading' : 'Stars'
                                            }
                                            size={18}
                                        />
                                    </span>
                                    <div className="ai-mode">
                                        <AIModeSelector
                                            aiMode={aiMode}
                                            aiModes={
                                                query
                                                    ? [
                                                          AIMode.GENERATE,
                                                          AIMode.EDIT,
                                                      ]
                                                    : [AIMode.GENERATE]
                                            }
                                            onModeSelect={setAIMode}
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
                                                aiMode === AIMode.GENERATE
                                                    ? 'Ask AI to generate the query'
                                                    : 'Ask AI to edit the query',
                                            type: 'text',
                                            onKeyDown,
                                            ref: inputRef,
                                            autoFocus: true,
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1, marginTop: 8 }}>
                                    {!showDiff && !thinking && (
                                        <div className="hint">
                                            Please select table(s) to use or AI
                                            can try to find the tables for you,
                                            but it does not guarantee finding
                                            the right tables.
                                        </div>
                                    )}
                                    {thinking && <div>Thinking...</div>}
                                    {/* {!showDiff && !!query && (
                                        <div>
                                            <div>Original Query</div>
                                            <ThemedCodeHighlightWithMark
                                                query={query}
                                                maxEditorHeight={'40vh'}
                                                autoHeight={true}
                                            />
                                        </div>
                                    )} */}

                                    {confirmTables && suggestedTablesDOM}

                                    {showDiff && (
                                        <div className="diff-container">
                                            {!!query &&
                                            aiMode === AIMode.EDIT ? (
                                                <QueryComparison
                                                    fromQuery={query}
                                                    toQuery={newQuery}
                                                />
                                            ) : (
                                                <ThemedCodeHighlightWithMark
                                                    query={newQuery}
                                                    maxEditorHeight={'40vh'}
                                                    autoHeight={true}
                                                />
                                            )}
                                            {!isAsking && (
                                                <div className="diff-controls">
                                                    <Button
                                                        title="Accept"
                                                        size="small"
                                                        onClick={() => {
                                                            // onAccept(newQuery)
                                                            onUpdateQuery(
                                                                newQuery
                                                            );
                                                            setShowDiff(false);
                                                            setNewQuery('');
                                                            setQuestion('');
                                                            setShow(false);
                                                        }}
                                                        color="accent"
                                                    />
                                                    <Button
                                                        title="Discard"
                                                        size="small"
                                                        onClick={() => {
                                                            setShowDiff(false);
                                                            setNewQuery('');
                                                            // setQuestion('');
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
