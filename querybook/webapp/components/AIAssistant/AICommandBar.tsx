import { uniq } from 'lodash';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';

import { AICommandInput } from 'components/AIAssistant/AICommandInput';
import { TableSelector } from 'components/AIAssistant/TableSelector';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryCellCommand, QUERY_CELL_COMMANDS } from 'const/command';
import { IQueryEngine } from 'const/queryEngine';
import { CommandRunner, useCommand } from 'hooks/useCommand';
import { useEvent } from 'hooks/useEvent';
import { useForwardedRef } from 'hooks/useForwardedRef';
import useNonEmptyState from 'hooks/useNonEmptyState';
import { trackClick } from 'lib/analytics';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { matchKeyPress } from 'lib/utils/keyboard';
import { analyzeCode } from 'lib/web-worker';
import { Button } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';

import './AICommandBar.scss';

interface IQueryCellCommandBarProps {
    query: string;
    queryEngine: IQueryEngine;
    engineId: number;
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    onUpdateQuery: (query: string, run: boolean) => void;
    onUpdateEngineId: (engineId: number) => void;
    onFormatQuery: () => void;
    ref: React.Ref<IResizableTextareaHandles>;
}

interface IAICommandResultViewProps {
    command: IQueryCellCommand;
    commandKwargs: Record<string, any>;
    metastoreId: number;
    originalQuery: string;
    tables: string[];
    commandResult: Record<string, any>;
    isStreaming: boolean;
    onContinue: () => void;
    onTablesChange: (tables: string[]) => void;
    onAccept: (query: string) => void;
    onDiscard: () => void;
}

const useTablesInQuery = (query: string, language: string) => {
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

const AICommandResultView = ({
    command,
    commandKwargs,
    metastoreId,
    originalQuery,
    tables,
    commandResult,
    isStreaming,
    onContinue,
    onTablesChange,
    onAccept,
    onDiscard,
}: IAICommandResultViewProps) => {
    const [newQuery, setNewQuery] = useNonEmptyState<string>('');
    const [explanation, setExplanation] = useState<string>('');
    const [foundTables, setFoundTables] = useState<boolean>(false);

    useEffect(() => {
        const { type, data } = commandResult;

        if (type === 'tables') {
            onTablesChange(data);
            setFoundTables(true);
        } else {
            const {
                explanation,
                query: rawNewQuery,
                data: additionalData,
            } = data;
            setExplanation(explanation || additionalData);
            setNewQuery(rawNewQuery);
            setFoundTables(false);
        }
    }, [commandResult]);

    const handleAccept = useCallback(() => {
        onAccept(newQuery);
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_GENERATION_APPLY_BUTTON,
            aux: {
                mode: command.name,
                question: commandKwargs.question,
                tables,
                query: newQuery,
            },
        });
    }, [onAccept, newQuery]);

    const handleDiscard = useCallback(() => {
        onDiscard();
        if (newQuery) {
            trackClick({
                component: ComponentType.AI_ASSISTANT,
                element: ElementType.QUERY_GENERATION_REJECT_BUTTON,
                aux: {
                    mode: command.name,
                    question: commandKwargs.question,
                    tables,
                    query: newQuery,
                },
            });
        }
    }, [onAccept, newQuery]);

    const tablesDOM = (
        <div className="mt12">
            <div>Please review table(s) to use for the query</div>
            <TableSelector
                metastoreId={metastoreId}
                tableNames={tables}
                onTableNamesChange={(tables) => {
                    onTablesChange(tables);
                    setFoundTables(true);
                }}
            />
            {foundTables && tables.length > 0 && (
                <div className="mt12">
                    <Button
                        title="Continue"
                        onClick={onContinue}
                        color="accent"
                    />
                </div>
            )}
        </div>
    );

    const queryDiffDOM = (originalQuery || newQuery) && (
        <div className="mt12">
            <QueryComparison
                fromQuery={originalQuery}
                toQuery={newQuery}
                fromQueryTitle="Original Query"
                toQueryTitle="New Query"
                disableHighlight={isStreaming}
                hideEmptyQuery={true}
                autoHeight={true}
            />
        </div>
    );

    const actionButtonsDOM = newQuery && !isStreaming && (
        <div className="right-align mt12">
            <Button title="Accept" onClick={handleAccept} color="confirm" />
            <Button title="Discard" onClick={handleDiscard} />
        </div>
    );

    return (
        <div>
            {tablesDOM}
            {explanation && <div className="mt12">{explanation}</div>}
            {queryDiffDOM}
            {actionButtonsDOM}
        </div>
    );
};

export const AICommandBar: React.FC<IQueryCellCommandBarProps> = forwardRef(
    ({ query = '', queryEngine, onUpdateQuery, onFormatQuery }, ref) => {
        const defaultCommand = QUERY_CELL_COMMANDS.find(
            (cmd) => cmd.name === (query ? 'edit' : 'generate')
        );
        const tablesInQuery = useTablesInQuery(query, queryEngine.language);
        const [tables, setTables] = useState(tablesInQuery);
        const commandInputRef = useForwardedRef<IResizableTextareaHandles>(ref);
        const [showPopupView, setShowPopupView] = useState(false);
        const [command, setCommand] =
            useState<IQueryCellCommand>(defaultCommand);
        const [commandInputValue, setCommandInputValue] = useState<string>();
        const [commandRunner, setCommandRunner] = useState<CommandRunner>();
        const [commandKwargs, setCommandKwargs] = useState<Record<string, any>>(
            {}
        );
        const [resetResult, setResetResult] = useState(false);

        const { runCommand, isRunning, cancelCommand, commandResult } =
            useCommand(command, commandRunner, resetResult);

        useEffect(() => {
            setTables((tables) => uniq([...tablesInQuery, ...tables]));
        }, [tablesInQuery]);

        useEffect(() => {
            if (command.name === 'format') {
                // Have to use a function here to prevent onFormatQuery from being called
                setCommandRunner(() => onFormatQuery);
            } else if (command.name === 'generate' || command.name === 'edit') {
                setCommandKwargs({
                    query_engine_id: queryEngine.id,
                    tables: tables,
                    question: commandInputValue,
                    original_query: command.name === 'generate' ? '' : query,
                });
            }
        }, [
            command.name,
            commandInputValue,
            onFormatQuery,
            query,
            queryEngine,
            tables,
        ]);

        const handleCommand = useCallback(() => {
            runCommand(commandKwargs);
            setResetResult(false);
            setShowPopupView(!command.inplace);

            if (command.name === 'generate' || command.name === 'edit') {
                trackClick({
                    component: ComponentType.AI_ASSISTANT,
                    element: ElementType.QUERY_GENERATION_BUTTON,
                    aux: {
                        mode: command.name,
                        question: commandKwargs.question,
                        tables,
                    },
                });
            }
        }, [command, runCommand, setShowPopupView, commandKwargs]);

        const onEscapeKeyDown = React.useCallback(
            (evt) => {
                if (matchKeyPress(evt, 'Esc')) {
                    setShowPopupView(false);
                }
            },
            [matchKeyPress, setShowPopupView]
        );
        useEvent('keydown', onEscapeKeyDown);

        const getCommandResultView = useCallback(() => {
            if (!commandResult) {
                return null;
            }

            if (command.name === 'generate' || command.name === 'edit') {
                return (
                    <AICommandResultView
                        command={command}
                        commandKwargs={commandKwargs}
                        metastoreId={queryEngine.metastore_id}
                        commandResult={commandResult}
                        tables={tables}
                        originalQuery={query}
                        isStreaming={isRunning}
                        onContinue={handleCommand}
                        onTablesChange={setTables}
                        onAccept={(query) => {
                            onUpdateQuery(query, false);
                            setShowPopupView(false);
                            setResetResult(true);
                        }}
                        onDiscard={() => {
                            setShowPopupView(false);
                            setResetResult(true);
                        }}
                    />
                );
            }

            // TODO: Handle other command types, or have it covered by AICommandResultView
            return null;
        }, [
            commandResult,
            queryEngine,
            tables,
            query,
            isRunning,
            handleCommand,
        ]);

        return (
            <div
                style={{
                    position: 'relative',
                }}
                tabIndex={0}
                className="AICommandBar"
            >
                {/* Placeholder to prevent layout shift */}
                {showPopupView && <div className="popup-placeholder" />}
                <div
                    className={showPopupView ? 'command-popup-view' : undefined}
                >
                    {showPopupView && (
                        <Message
                            message="Note: This AI-powered query generation may be inaccurate. Please use your own judgement and verify the result."
                            type="warning"
                            className="warning-message"
                        />
                    )}
                    <AICommandInput
                        commands={QUERY_CELL_COMMANDS}
                        placeholder={command.hint}
                        onCommandChange={(command, inputValue) => {
                            setCommand(command || defaultCommand);
                            setCommandInputValue(inputValue);
                        }}
                        onSubmit={handleCommand}
                        running={isRunning}
                        cancelGeneration={cancelCommand}
                        ref={commandInputRef}
                    />
                    {showPopupView && getCommandResultView()}
                </div>
            </div>
        );
    }
);
