import React, {
    forwardRef,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Mention, MentionsInput } from 'react-mentions';

import { IQueryCellCommand } from 'const/command';
import { useForwardedRef } from 'hooks/useForwardedRef';
import { KeyMap, matchKeyMap, matchKeyPress } from 'lib/utils/keyboard';
import { SearchTableResource } from 'resource/search';
import { Button } from 'ui/Button/Button';
import { Icon } from 'ui/Icon/Icon';
import { Popover } from 'ui/Popover/Popover';
import { IResizableTextareaHandles } from 'ui/ResizableTextArea/ResizableTextArea';

import './AICommandInput.scss';

interface AICommandInputProps {
    commands: Array<IQueryCellCommand>;
    placeholder?: string;
    running: boolean;
    mentionedTables: string[];
    metastoreId: number;
    onCommandChange: (command: IQueryCellCommand, commandArg: string) => void;
    onMentionedTablesChange: (tables: string[]) => void;
    onSubmit: () => void;
    cancelGeneration: () => void;
    ref: React.Ref<IResizableTextareaHandles>;
}

const mentionInputStyle = {
    flex: 1,
    control: {
        minHeight: '40px',
    },
    highlighter: {
        border: 'none',
        padding: '8px',
        lineHeight: '24px',
    },
    input: {
        border: 'none',
        padding: '8px',
        lineHeight: '24px',
    },
    suggestions: {
        backgroundColor: 'var(--bg)',
        borderRadius: '6px',
        overflow: 'hidden',
        zIndex: 19,
        boxShadow: '0 0px 4px var(--bg-dark)',
        item: {
            fontSize: 'var(--xsmall-text-size)',
            padding: '6px 12px',
            textAlign: 'left',
            backgroundColor: 'transparent',
            '&focused': {
                backgroundColor: 'var(--bg-hover)',
            },
        },
    },
};

export const AICommandInput: React.FC<AICommandInputProps> = forwardRef(
    (
        {
            commands = [],
            running,
            mentionedTables,
            metastoreId,
            onCommandChange,
            onMentionedTablesChange,
            onSubmit,
            cancelGeneration,
        },
        ref
    ) => {
        const textareaRef = useForwardedRef<IResizableTextareaHandles>(ref);
        const anchorRef = useRef<HTMLDivElement>(null);
        const [showCommands, setShowCommands] = useState(false);
        const [command, setCommand] = useState<IQueryCellCommand>();
        const [commandValue, setCommandValue] = useState('');
        const [currentCommandItemIndex, setCurrentCommandItemIndex] =
            useState(0);

        const filteredCommands = useMemo(() => {
            if (command || !commandValue.startsWith('/')) {
                return [];
            }
            return commands.filter((cmd) =>
                ('/' + cmd.name).startsWith(commandValue.toLowerCase())
            );
        }, [command, commandValue, commands]);

        useEffect(() => {
            onCommandChange(command, commandValue);
        }, [command, commandValue]);

        const setNewCommand = useCallback(
            (newCommand: IQueryCellCommand) => {
                setCommand(newCommand);
                setCommandValue('');
            },
            [setCommand, setCommandValue]
        );

        const handleChange = useCallback(
            (
                evt,
                value: string,
                newPlainTextValue,
                mentions: Array<{ id: string; display: string }>
            ) => {
                onMentionedTablesChange(mentions.map((mention) => mention.id));
                if (command || !value.startsWith('/')) {
                    setCommandValue(value);
                    return;
                }

                // when value starts with "/"
                const newCommand = commands.find(
                    (cmd) => '/' + cmd.name === value.toLowerCase()
                );

                // found a matching command
                if (newCommand) {
                    setNewCommand(newCommand);
                } else {
                    setCommandValue(value);
                    setShowCommands(true);
                }
            },
            [command, commands, setNewCommand, setCommandValue]
        );

        const onKeyDown = useCallback(
            (event: React.KeyboardEvent) => {
                let handled = true;
                // Cmd + / will reset the command and value and open the command options
                if (matchKeyMap(event, KeyMap.aiCommandBar.openCommands)) {
                    setNewCommand(undefined);
                    setCommandValue('/');
                    setShowCommands(true);
                } else if (filteredCommands.length > 0) {
                    if (
                        matchKeyPress(event, 'Enter') ||
                        matchKeyPress(event, 'Tab')
                    ) {
                        setNewCommand(
                            filteredCommands[currentCommandItemIndex]
                        );
                    } else if (matchKeyPress(event, 'Up')) {
                        setCurrentCommandItemIndex((prev) =>
                            Math.max(prev - 1, 0)
                        );
                    } else if (matchKeyPress(event, 'Down')) {
                        setCurrentCommandItemIndex((prev) =>
                            Math.min(prev + 1, filteredCommands.length - 1)
                        );
                    } else {
                        handled = false;
                    }
                } else if (matchKeyPress(event, 'Enter') && !event.shiftKey) {
                    if (!running) {
                        onSubmit();
                    }
                } else if (matchKeyPress(event, 'Delete') && !commandValue) {
                    setCommand(undefined);
                } else {
                    handled = false;
                }

                if (handled) {
                    event.preventDefault();
                    event.stopPropagation();
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

        const loadTables = useCallback(
            (
                keyword: string,
                callback: (
                    options: Array<{ id: string; display: string }>
                ) => void
            ) => {
                if (!keyword) {
                    return;
                }

                SearchTableResource.searchConcise({
                    metastore_id: metastoreId,
                    keywords: keyword,
                }).then(({ data }) => {
                    const filteredTableNames = data.results.filter(
                        (result) =>
                            !mentionedTables.includes(
                                `${result.schema}.${result.name}`
                            )
                    );
                    const tableNameOptions = filteredTableNames.map(
                        ({ schema, name }) => ({
                            id: `${schema}.${name}`,
                            display: `${schema}.${name}`,
                        })
                    );
                    callback(tableNameOptions);
                });
            },
            [metastoreId, mentionedTables]
        );
        return (
            <div className="AICommandInput">
                <span className="stars-icon">
                    <Icon
                        name={running ? 'Loading' : 'Stars'}
                        size={18}
                        // color="accent"
                    />
                </span>
                <div ref={anchorRef} className="command-container">
                    {command && (
                        <div className="command">{'/' + command.name}</div>
                    )}
                </div>
                <MentionsInput
                    value={commandValue}
                    onChange={handleChange}
                    onKeyDown={onKeyDown}
                    style={mentionInputStyle}
                    placeholder={
                        command
                            ? command.hint
                            : `Ask AI to generate/edit the query. Type @ to select a table. Type / to see more commands. Type ${KeyMap.aiCommandBar.openCommands.key} to reset the command.`
                    }
                    onBlur={() => setShowCommands(false)}
                    inputRef={textareaRef}
                >
                    <Mention
                        markup={`{{@__id__}}`}
                        appendSpaceOnAdd={true}
                        displayTransform={(mention) => `@${mention}`}
                        trigger="@"
                        data={loadTables}
                        style={{
                            position: 'relative',
                            zIndex: 1,
                            color: 'var(--color-accent-dark)',
                            backgroundColor: 'var(--color-accent-lightest-0)',
                            borderRadius: '4px',
                        }}
                    />
                </MentionsInput>
                {showCommands && filteredCommands.length > 0 && (
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
