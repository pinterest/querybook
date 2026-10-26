import { truncate, uniq } from 'lodash';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import toast from 'react-hot-toast';

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
import { useForwardedRef } from 'hooks/useForwardedRef';
import { trackClick } from 'lib/analytics';
import { Button } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';
import { StyledText } from 'ui/StyledText/StyledText';
import { KeyMap } from 'lib/utils/keyboard';

import './AICommandBar.scss';

interface IQueryCellCommandBarProps {
    query: string;
    queryEngine: IQueryEngine;
    tablesInQuery: string[];
    onUpdateQuery: (query: string, run: boolean) => void;
    onFormatQuery: () => void;
    ref: React.Ref<IResizableTextareaHandles>;
}

export const AICommandBar: React.FC<IQueryCellCommandBarProps> = forwardRef(
    (
        {
            query = '',
            queryEngine,
            tablesInQuery = [],
            onUpdateQuery,
            onFormatQuery,
        },
        ref
    ) => {
        const defaultCommand = QUERY_CELL_COMMANDS.find(
            (cmd) => cmd.name === (query ? 'edit' : 'generate')
        );
        const [tables, setTables] = useState<string[]>(tablesInQuery);
        const [mentionedTables, setMentionedTables] = useState<string[]>([]);
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
        const [hasUnviewedResult, setHasUnviewedResult] = useState(false);
        const commandBarRef = useRef<HTMLDivElement>(null);
        const runningInBackgroundRef = useRef(false);
        const readyToastIdRef = useRef<string>(null);
        const submittedKwargsRef = useRef<Record<string, any>>({});

        /**
         * There are three types of tables:
         * 1. Tables used in the query.
         * 2. Tables mentioned in the command.
         * 3. Tables selected in the table selector.
         *
         * Regarding which tables to use:
         * - If there are mentioned tables in the command, use those.
         * - If there are no mentioned tables, use the tables in the query (type 1) merged with the selected tables (type 3).
         * - However, selected tables will override the tables in the query. If a table is deselected, it will be removed from the list, including the tables in the query.
         */
        useEffect(() => {
            setTables(uniq([...tables, ...tablesInQuery]));
        }, [tablesInQuery]);

        const finalTablesToUse = useMemo(
            () => (mentionedTables.length ? mentionedTables : tables),
            [mentionedTables, tables]
        );

        const {
            runCommand,
            isRunning,
            commandFailed,
            cancelCommand,
            commandResult,
            resetCommandResult,
        } = useCommand(command, commandRunner);

        const dismissReadyToast = useCallback(() => {
            if (readyToastIdRef.current) {
                toast.dismiss(readyToastIdRef.current);
                readyToastIdRef.current = null;
            }
        }, []);

        useEffect(() => dismissReadyToast, [dismissReadyToast]);

        const viewBackgroundResult = useCallback(() => {
            dismissReadyToast();
            setHasUnviewedResult(false);
            setShowPopupView(true);
            commandBarRef.current?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
        }, [dismissReadyToast]);

        useEffect(() => {
            if (isRunning || !runningInBackgroundRef.current) {
                return;
            }
            runningInBackgroundRef.current = false;
            if (!commandResult || commandFailed) {
                return;
            }

            setHasUnviewedResult(true);
            const question = truncate(submittedKwargsRef.current.question, {
                length: 60,
            });
            readyToastIdRef.current = toast.success(
                <div className="flex-row">
                    <span>AI response ready for "{question}"</span>
                    <Button
                        className="ml8"
                        title="View"
                        size="small"
                        onClick={viewBackgroundResult}
                    />
                    <Button
                        className="ml4"
                        title="Dismiss"
                        size="small"
                        theme="text"
                        onClick={dismissReadyToast}
                    />
                </div>,
                { duration: Infinity }
            );
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isRunning]);

        const handleCancelCommand = useCallback(() => {
            runningInBackgroundRef.current = false;
            cancelCommand();
        }, [cancelCommand]);

        useEffect(() => {
            if (!query && mentionedTables.length === 1) {
                onUpdateQuery(
                    `SELECT * FROM ${mentionedTables[0]} LIMIT 10`,
                    false
                );
                onFormatQuery();
            }
        }, [mentionedTables]);

        useEffect(() => {
            if (command.name === 'format') {
                // Have to use a function here to prevent onFormatQuery from being called
                setCommandRunner(() => onFormatQuery);
            } else if (command.name === 'generate' || command.name === 'edit') {
                setCommandKwargs({
                    query_engine_id: queryEngine.id,
                    tables: finalTablesToUse,
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
            runningInBackgroundRef.current = false;
            dismissReadyToast();
            setHasUnviewedResult(false);
            submittedKwargsRef.current = commandKwargs;
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
                        tables: finalTablesToUse,
                    },
                });
            }
        }, [
            command,
            runCommand,
            setShowPopupView,
            commandKwargs,
            dismissReadyToast,
        ]);

        const getCommandResultView = () => {
            if (command.name === 'generate' || command.name === 'edit') {
                return (
                    <AICommandResultView
                        command={command}
                        commandKwargs={submittedKwargsRef.current}
                        metastoreId={queryEngine.metastore_id}
                        commandResult={commandResult}
                        tables={tables}
                        hasMentionedTables={mentionedTables.length > 0}
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
                <div className="discard-confirm-background" />
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
            <div
                ref={commandBarRef}
                className="AICommandBar"
                aria-label={`Type @ to select a table. Type / to see more commands. Type ${KeyMap.aiCommandBar.openCommands.key} to reset the command.`}
                data-balloon-pos="up-left"
            >
                {showPopupView && (
                    <>
                        {/* This is a workaround to hide the query cell controls when hovering */}
                        <div className="cover-controls-banner" />
                        <div
                            className="popup-backdrop"
                            onClick={() => {
                                if (isRunning) {
                                    runningInBackgroundRef.current = true;
                                    setShowPopupView(false);
                                } else if (commandResult) {
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
                        mentionedTables={mentionedTables}
                        onMentionedTablesChange={setMentionedTables}
                        metastoreId={queryEngine.metastore_id}
                        onSubmit={handleCommand}
                        running={isRunning}
                        cancelGeneration={handleCancelCommand}
                        onViewResult={
                            hasUnviewedResult ? viewBackgroundResult : undefined
                        }
                        ref={commandInputRef}
                    />
                    {showPopupView && getCommandResultView()}
                    {showConfirm && discardConfirmDOM}
                </div>
            </div>
        );
    }
);
