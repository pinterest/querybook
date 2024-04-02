import { useCallback, useEffect, useRef, useState } from 'react';

import { AICommandType } from 'const/aiAssistant';
import { IQueryCellCommand, QueryCellCommandType } from 'const/command';
import { useAISocket } from 'hooks/useAISocket';

type SyncCommandRunner = (kwargs: Record<string, any>) => any;
type AsyncCommandRunner = (kwargs: Record<string, any>) => Promise<any>;

export type CommandRunner = SyncCommandRunner | AsyncCommandRunner;

export const useCommand = (
    command: IQueryCellCommand,
    commandRunner?: CommandRunner
): {
    runCommand: (kwargs: Record<string, any>) => void;
    isRunning: boolean;
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
