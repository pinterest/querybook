import { uniq } from 'lodash';
import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useState,
} from 'react';

import { AICommandInput } from 'components/AIAssistant/AICommandInput';
import { AICommandModal } from 'components/AIAssistant/AICommandModal';
import { IQueryCellCommand, QUERY_CELL_COMMANDS } from 'const/command';
import { IQueryEngine } from 'const/queryEngine';
import { useAICommandSession } from 'hooks/useAICommandSession';
import { useForwardedRef } from 'hooks/useForwardedRef';
import { KeyMap } from 'lib/utils/keyboard';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';

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
        const [command, setCommand] =
            useState<IQueryCellCommand>(defaultCommand);
        const [commandInputValue, setCommandInputValue] = useState<string>('');

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

        const session = useAICommandSession({
            queryEngineId: queryEngine.id,
            onTablesSuggested: setTables,
            onAccept: (newQuery) => onUpdateQuery(newQuery, false),
        });

        const { submit } = session;

        useEffect(() => {
            if (!query && mentionedTables.length === 1) {
                onUpdateQuery(
                    `SELECT * FROM ${mentionedTables[0]} LIMIT 10`,
                    false
                );
                onFormatQuery();
            }
        }, [mentionedTables]);

        const handleSubmit = useCallback(() => {
            if (command.name === 'format') {
                onFormatQuery();
                return;
            }
            if (command.name !== 'generate' && command.name !== 'edit') {
                return;
            }
            submit({
                kind: command.name,
                question: commandInputValue,
                originalQuery: command.name === 'generate' ? '' : query,
                tables: finalTablesToUse,
            });
        }, [
            command.name,
            commandInputValue,
            query,
            finalTablesToUse,
            onFormatQuery,
            submit,
        ]);

        return (
            <div
                className="AICommandBar"
                aria-label={`Type @ to select a table. Type / to see more commands. Type ${KeyMap.aiCommandBar.openCommands.key} to reset the command.`}
                data-balloon-pos="up-left"
            >
                <AICommandInput
                    commands={QUERY_CELL_COMMANDS}
                    onCommandChange={(command, inputValue) => {
                        setCommand(command ?? defaultCommand);
                        setCommandInputValue(inputValue);
                    }}
                    mentionedTables={mentionedTables}
                    onMentionedTablesChange={setMentionedTables}
                    metastoreId={queryEngine.metastore_id}
                    onSubmit={handleSubmit}
                    running={session.isRunning}
                    cancelGeneration={session.cancel}
                    onViewResult={
                        session.hasUnviewedResult ? session.view : undefined
                    }
                    ref={commandInputRef}
                />
                {session.modalOpen && session.request && (
                    <AICommandModal
                        request={session.request}
                        result={session.result}
                        isStreaming={session.isStreaming}
                        metastoreId={queryEngine.metastore_id}
                        originalQuery={query}
                        tables={tables}
                        hasMentionedTables={mentionedTables.length > 0}
                        onTablesChange={setTables}
                        onContinue={() =>
                            session.continueRequest(finalTablesToUse)
                        }
                        onRequestChanges={(requestedChanges) =>
                            session.requestChanges(
                                requestedChanges,
                                finalTablesToUse
                            )
                        }
                        onAccept={session.accept}
                        onReject={session.reject}
                        onDismiss={session.dismiss}
                    />
                )}
            </div>
        );
    }
);
