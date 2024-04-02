import React, {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
} from 'react';

import { IQueryCellCommand } from 'const/command';
import { useForwardedRef } from 'hooks/useForwardedRef';
import { matchKeyPress } from 'lib/utils/keyboard';
import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Popover } from 'ui/Popover/Popover';
import {
    IResizableTextareaHandles,
    ResizableTextArea,
} from 'ui/ResizableTextArea/ResizableTextArea';

import './AICommandInput.scss';

interface AICommandInputProps {
    commands: Array<IQueryCellCommand>;
    placeholder?: string;
    running: boolean;
    onCommandChange: (command: IQueryCellCommand, commandArg: string) => void;
    onSubmit: () => void;
    cancelGeneration: () => void;
    ref: React.Ref<IResizableTextareaHandles>;
}

export const AICommandInput: React.FC<AICommandInputProps> = forwardRef(
    (
        { commands = [], running, onCommandChange, onSubmit, cancelGeneration },
        ref
    ) => {
        const textareaRef = useForwardedRef<IResizableTextareaHandles>(ref);
        const anchorRef = useRef<HTMLDivElement>(null);
        const [command, setCommand] = useState<IQueryCellCommand>();
        const [commandValue, setCommandValue] = useState('');

        const [filteredCommands, setFilteredCommands] = useState([]);
        const [currentCommandItemIndex, setCurrentCommandItemIndex] =
            useState(0);

        useEffect(() => {
            onCommandChange(command, commandValue);
        }, [command, commandValue]);

        const setNewCommand = useCallback(
            (newCommand: IQueryCellCommand) => {
                setCommand(newCommand);
                setFilteredCommands([]);
                setCommandValue('');
            },
            [setCommand, setCommandValue, setFilteredCommands]
        );

        const handleChange = useCallback(
            (value: string) => {
                if (command || !value.startsWith('/')) {
                    setCommandValue(value);
                    setFilteredCommands([]);
                    return;
                }

                // when value starts with "/"
                const prefix = value.trimStart().slice(1).toLocaleLowerCase(); // trim the leading '/'
                const newCommand = commands.find((cmd) => cmd.name === prefix);

                // found a matching command
                if (newCommand) {
                    setNewCommand(newCommand);
                } else {
                    setCommandValue(value);
                    setFilteredCommands(
                        commands.filter((cmd) => cmd.name.startsWith(prefix))
                    );
                }
            },
            [
                command,
                commands,
                setNewCommand,
                setCommandValue,
                setFilteredCommands,
            ]
        );

        const onKeyDown = useCallback(
            (event: React.KeyboardEvent) => {
                if (filteredCommands.length > 0) {
                    if (
                        matchKeyPress(event, 'Enter') ||
                        matchKeyPress(event, 'Tab')
                    ) {
                        setNewCommand(
                            filteredCommands[currentCommandItemIndex]
                        );
                        event.preventDefault();
                        return;
                    }

                    if (matchKeyPress(event, 'Up')) {
                        setCurrentCommandItemIndex((prev) =>
                            Math.max(prev - 1, 0)
                        );
                        event.preventDefault();
                        return;
                    }
                    if (matchKeyPress(event, 'Down')) {
                        setCurrentCommandItemIndex((prev) =>
                            Math.min(prev + 1, filteredCommands.length - 1)
                        );
                        event.preventDefault();
                        return;
                    }
                } else if (matchKeyPress(event, 'Enter') && !event.shiftKey) {
                    if (!running) {
                        onSubmit();
                    }
                    event.preventDefault();
                } else if (matchKeyPress(event, 'Delete') && !commandValue) {
                    setCommand(undefined);
                }
            },
            [
                commandValue,
                filteredCommands,
                onSubmit,
                currentCommandItemIndex,
                running,
            ]
        );

        const commandItemDom = ({ name, hint }) => (
            <div className="command-item">
                <span className="command-name">{'/' + name}</span>
                <span className="flex1" />
                <span className="command-hint">{hint}</span>
            </div>
        );

        return (
            <div className="AICommandInput">
                <span className="stars-icon">
                    <Icon
                        name={running ? 'Loading' : 'Stars'}
                        size={18}
                        color="accent"
                    />
                </span>
                <div ref={anchorRef} className="command-container">
                    {command && (
                        <div className="command">{'/' + command.name}</div>
                    )}
                </div>
                <ResizableTextArea
                    value={commandValue}
                    onChange={handleChange}
                    className="question-text-area"
                    placeholder={
                        command
                            ? command.hint
                            : 'Ask AI to generate/edit the query, or type / to see more options'
                    }
                    onKeyDown={onKeyDown}
                    disabled={running}
                    transparent
                    ref={textareaRef}
                />
                {filteredCommands.length > 0 && (
                    <Popover
                        hideArrow={true}
                        noPadding={true}
                        anchor={anchorRef.current}
                        layout={['bottom', 'left']}
                        onHide={() => null}
                    >
                        <div className="AICommandInput-popover">
                            {filteredCommands.map((cmd, index) => {
                                return (
                                    <div
                                        key={cmd.name}
                                        onClick={() => {
                                            setNewCommand(cmd);
                                            textareaRef.current?.focus();
                                        }}
                                        className={
                                            currentCommandItemIndex === index
                                                ? 'active'
                                                : undefined
                                        }
                                    >
                                        {commandItemDom(cmd)}
                                    </div>
                                );
                            })}
                        </div>
                    </Popover>
                )}
                {running && (
                    <Button
                        title="Stop"
                        color="cancel"
                        onClick={cancelGeneration}
                        className="button"
                    />
                )}
            </div>
        );
    }
);
