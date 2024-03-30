import { useCallback, useEffect, useRef, useState } from 'react';

import { AICommandType } from 'const/aiAssistant';
import { IQueryCellCommand, QueryCellCommandType } from 'const/command';
import { useAISocket } from 'hooks/useAISocket';

const COMMANDS_TO_AI_COMMAND_TYPE = {
    generate: AICommandType.TEXT_TO_SQL,
    edit: AICommandType.TEXT_TO_SQL,
    fix: AICommandType.SQL_FIX,
};

type SyncCommandRunner = (kwargs: Record<string, any>) => any;
type AsyncCommandRunner = (
    kwargs: Record<string, string>,
    callback: (data: any) => void
) => void;

export type CommandRunner = SyncCommandRunner | AsyncCommandRunner;

export const useCommand = (
    command: IQueryCellCommand,
    commandRunner?: CommandRunner,
    resetResult?: boolean
) => {
    const [isRunning, setIsRunning] = useState(false);
    const [commandResult, setCommandResult] = useState<any>();

    const socket = useAISocket(command.aiCommand, setCommandResult);

    useEffect(() => {
        if (resetResult) {
            setCommandResult(undefined);
        }
    }, [resetResult]);

    const runCommand = useCallback(
        (kwargs) => {
            if (command.type === QueryCellCommandType.SYNC) {
                setIsRunning(true);
                const result = (commandRunner as SyncCommandRunner)(kwargs);
                setCommandResult(result);
                setIsRunning(false);
            } else if (command.type === QueryCellCommandType.ASYNC) {
                setIsRunning(true);
                (commandRunner as AsyncCommandRunner)(kwargs, (result) => {
                    setCommandResult(result);
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
    };
};
