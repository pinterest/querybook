import { set, uniq } from 'lodash';
import React, { forwardRef, useCallback, useEffect, useState } from 'react';

import { AICommandInput } from 'components/AIAssistant/AICommandInput';
import { AICommandResultView } from 'components/AIAssistant/AICommandResultView';
import { ComponentType, ElementType } from 'const/analytics';
import {
    IQueryCellCommand,
    QUERY_CELL_COMMANDS,
    QueryCellCommandType,
} from 'const/command';
import { IQueryEngine } from 'const/queryEngine';
import { CommandRunner, useCommand } from 'hooks/useCommand';
import { useEvent } from 'hooks/useEvent';
import { useForwardedRef } from 'hooks/useForwardedRef';
import { trackClick } from 'lib/analytics';
import { TableToken } from 'lib/sql-helper/sql-lexer';
import { matchKeyPress } from 'lib/utils/keyboard';
import { analyzeCode } from 'lib/web-worker';
import { Button, TextButton } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { Message } from 'ui/Message/Message';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';
import { StyledText } from 'ui/StyledText/StyledText';

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
        const [commandInputValue, setCommandInputValue] = useState<string>('');
        const [commandRunner, setCommandRunner] = useState<CommandRunner>();
        const [commandKwargs, setCommandKwargs] = useState<Record<string, any>>(
            {}
        );
        const [showConfirm, setShowConfirm] = useState(false);

        const {
            runCommand,
            isRunning,
            cancelCommand,
            commandResult,
            resetCommandResult,
        } = useCommand(command, commandRunner);

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
            resetCommandResult();
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

        const getCommandResultView = () => {
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
                            resetCommandResult();
                        }}
                        onDiscard={() => {
                            setShowPopupView(false);
                            resetCommandResult();
                        }}
                    />
                );
            }

            // TODO: Handle other command types, or have it covered by AICommandResultView
            return null;
        };

        const discardConfirmDOM = (
            <div className="discard-confirm-view">
                <div className="discard-confirm-background"></div>
                <div className="discard-confirm-dialog">
                    <StyledText size="med" weight="bold">
                        Are you sure you want to discard the changes?
                    </StyledText>
                    <div className="flex-right" style={{ marginTop: 12 }}>
                        <Button
                            title="Cancel"
                            onClick={() => setShowConfirm(false)}
                        />
                        <Button
                            title="Confirm"
                            color="confirm"
                            onClick={() => {
                                setShowPopupView(false);
                                setShowConfirm(false);
                            }}
                        />
                    </div>
                </div>
            </div>
        );

        return (
            <div className="AICommandBar">
                {showPopupView && (
                    <>
                        {/* This is a workaround to hide the query cell controls when hovering */}
                        <div className="cover-controls-banner" />
                        <div
                            className="popup-backdrop"
                            onClick={() => {
                                if (commandResult) {
                                    setShowConfirm(true);
                                } else {
                                    setShowPopupView(false);
                                }
                            }}
                        />
                        {/* Placeholder to prevent layout shift */}
                        <div className="popup-placeholder" />
                    </>
                )}
                <div
                    className={showPopupView ? 'command-popup-view' : undefined}
                >
                    {showPopupView &&
                        command.type === QueryCellCommandType.AI && (
                            <Message
                                message="Note: This AI-powered query generation may be inaccurate. Please use your own judgement and verify the result."
                                type="warning"
                                className="warning-message"
                            />
                        )}
                    <AICommandInput
                        commands={QUERY_CELL_COMMANDS}
                        onCommandChange={(command, inputValue) => {
                            setCommand(
                                (oldCommand) => command ?? defaultCommand
                            );
                            setCommandInputValue(inputValue);
                        }}
                        onSubmit={handleCommand}
                        running={isRunning}
                        cancelGeneration={cancelCommand}
                        ref={commandInputRef}
                    />
                    {showPopupView && getCommandResultView()}
                    {showConfirm && discardConfirmDOM}
                </div>
            </div>
        );
    }
);
