import { useCallback, useEffect, useRef, useState } from 'react';

import { AICommandType } from 'const/aiAssistant';
import { IQueryCellCommand, QueryCellCommandType } from 'const/command';
import { useAISocket } from 'hooks/useAISocket';

type SyncCommandRunner = (kwargs: Record<string, any>) => any;
type AsyncCommandRunner = (kwargs: Record<string, any>) => Promise<any>;

export type CommandRunner = SyncCommandRunner | AsyncCommandRunner;

/**
 * Runs a query cell command (sync, async or AI) through one interface.
 *
 * The AI command bar no longer uses this hook: it uses useAICommandSession,
 * which keeps the text-to-SQL socket fixed so switching commands can't drop a
 * running AI request. It's kept because webpage plugins (custom_script.ts)
 * can import webapp modules and may use it.
 */
export const useCommand = (
    command: IQueryCellCommand,
    commandRunner?: CommandRunner
): {
    runCommand: (kwargs: Record<string, any>) => void;
    isRunning: boolean;
    commandFailed: boolean;
    commandResult: any;
    cancelCommand: () => void;
    resetCommandResult: () => void;
} => {
    const [isRunning, setIsRunning] = useState(false);
    const [commandResult, setCommandResult] = useState<any>();

    const socket = useAISocket(command.aiCommand, setCommandResult);

    const runCommand = useCallback(
        (kwargs: Record<string, any>) => {
            if (command.type === QueryCellCommandType.SYNC) {
                setIsRunning(true);
                const result = (commandRunner as SyncCommandRunner)(kwargs);
                setCommandResult(result);
                setIsRunning(false);
            } else if (command.type === QueryCellCommandType.ASYNC) {
                setIsRunning(true);
                (commandRunner as AsyncCommandRunner)(kwargs)
                    .then((result) => {
                        if (!isRunning) {
                            setCommandResult(result);
                        }
                    })
                    .finally(() => {
                        setIsRunning(false);
                    });
            } else if (
                command.type === QueryCellCommandType.AI &&
                socket.emit
            ) {
                socket.emit(kwargs);
            }
        },
        [command, commandRunner, socket.emit]
    );

    return {
        runCommand,
        isRunning:
            command.type === QueryCellCommandType.AI
                ? socket.loading
                : isRunning,
        commandFailed:
            command.type === QueryCellCommandType.AI ? socket.failed : false,
        commandResult,
        cancelCommand:
            command.type === QueryCellCommandType.AI
                ? socket.cancel
                : () => {
                      setIsRunning(false);
                  },
        resetCommandResult: () => setCommandResult(undefined),
    };
};
