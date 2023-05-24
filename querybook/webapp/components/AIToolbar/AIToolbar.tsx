import React, { useEffect, useState } from 'react';

import { DataDocChart } from 'components/DataDocChartCell/DataDocChart';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { matchKeyPress } from 'lib/utils/keyboard';
import { Button } from 'ui/Button/Button';
import { IconButton } from 'ui/Button/IconButton';
import { ThemedCodeHighlightWithMark } from 'ui/CodeHighlight/ThemedCodeHighlightWithMark';
import { DebouncedInput } from 'ui/DebouncedInput/DebouncedInput';
import { Icon } from 'ui/Icon/Icon';
import { Modal } from 'ui/Modal/Modal';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './AIToolbar.scss';

interface IProps {
    query: string;
    onUpdateQuery?: (query: string) => void;
    onUpdateTitle?: (query: string) => void;
}

export const AIToolbar = ({
    query = '',
    onUpdateQuery,
    onUpdateTitle,
}: IProps) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [question, setQuestion] = useState<string>('');
    const [isAsking, setIsAsking] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [newQuery, setNewQuery] = useState(query);

    const askAI = async () => {
        console.log('asking AI');
        const needTitle = !query;
        setIsAsking(true);
        const response = await fetch('/ds/ai/text2sql/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
            }),
        });

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
            onUpdateQuery?.(chunks);
        }
        setIsAsking(false);
        if (needTitle) {
            await generateTitle(chunks);
        }
        setQuestion('');
    };

    const editQuery = async () => {
        setIsAsking(true);
        const response = await fetch('/ds/ai/edit_query/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question,
                query,
            }),
        });
        const { data } = await response.json();
        setShowDiff(true);
        console.log('data', data);
        setNewQuery(data);
        setIsAsking(false);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (matchKeyPress(event, 'Enter')) {
            if (!query) {
                askAI();
            } else {
                editQuery();
            }
            inputRef.current.blur();
        }
    };

    const onAutoFix = async () => {
        setIsAsking(true);
        const response = await fetch('/ds/ai/auto_fix/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        });
        const { data } = await response.json();
        setShowDiff(true);
        console.log('data', data);
        setNewQuery(data);
        setIsAsking(false);
    };

    const generateTitle = async (query) => {
        console.log('asking AI');
        setIsAsking(true);
        const response = await fetch('/ds/ai/generate_title/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        });

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
            onUpdateTitle?.(chunks);
        }
        setIsAsking(false);
    };

    const bottomDOM = (
        <div className="right-align mb16">
            <Button title="Cancel" onClick={() => setShowDiff(false)} />
            <Button
                title="Confirm"
                color="confirm"
                onClick={() => {
                    onUpdateQuery?.(newQuery);
                    setShowDiff(false);
                }}
            />
        </div>
    );
    return (
        <div className="AIToolbar">
            <span className="StarsIcon">
                <Icon name={isAsking ? 'Loading' : 'Stars'} size={18} />
            </span>
            <DebouncedInput
                debounceTime={0}
                debounceMethod="debounce"
                onChange={setQuestion}
                value={question}
                transparent={false}
                inputProps={{
                    placeholder: 'Ask AI to generate or edit the query',
                    type: 'text',
                    onKeyDown,
                    ref: inputRef,
                    autoFocus: true,
                }}
            />
            <IconButton
                icon="Bug"
                size={18}
                tooltip="Auto Fix"
                onClick={onAutoFix}
            />
            <IconButton
                icon="Hash"
                size={18}
                tooltip="Add Query Title"
                onClick={() => generateTitle(query)}
            />
            {showDiff && (
                <Modal onHide={() => setShowDiff(false)} bottomDOM={bottomDOM}>
                    <QueryComparison fromQuery={query} toQuery={newQuery} />
                </Modal>
            )}
        </div>
    );
};

export const QueryTitleEditor = ({
    value,
    onChange,
    placeholder,
    onUpdateTitle,
    query,
}) => {
    const [loading, setLoading] = useState(false);
    const generateTitle = async (query) => {
        console.log('asking AI');
        setLoading(true);
        const response = await fetch('/ds/ai/generate_title/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
            }),
        });

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
            onUpdateTitle?.(chunks);
        }
        setLoading(false);
    };
    return (
        <div className="AIToolbar">
            {!!query && (
                <IconButton
                    className="StarsIconButton"
                    icon="Hash"
                    size={18}
                    tooltip="AI: generate title"
                    color={!value && query ? 'accent' : undefined}
                    onClick={() => generateTitle(query)}
                />
            )}
            <ResizableTextArea
                value={value}
                onChange={onChange}
                transparent
                placeholder={placeholder}
                className={`Title ${!!query ? 'with-icon' : ''}`}
            />
        </div>
    );
};

export const AIAutoFixButton = ({ query, error, onUpdateQuery }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [show, setShow] = useState(false);
    const [question, setQuestion] = useState<string>('');
    const [isAsking, setIsAsking] = useState(false);
    const [newQuery, setNewQuery] = useState('');
    const [showDiff, setShowDiff] = useState(false);
    const [startDiff, setStartDiff] = useState(false);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const editQuery = async () => {
        setIsAsking(true);
        setShowDiff(false);
        setNewQuery('');
        const response = await fetch('/ds/ai/auto_fix_stream/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query,
                error,
            }),
        });
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
        setShowDiff(true);
        setStartDiff(true);
    };

    const resetState = () => {
        setShow(false);
        setQuestion('');
        setNewQuery('');
        setShowDiff(false);
        setStartDiff(false);
    };

    const bottomDOM = newQuery && (
        <div className="right-align mb16">
            <Button
                title="Use Query"
                color="confirm"
                onClick={() => {
                    onUpdateQuery?.(newQuery);
                    resetState();
                }}
            />
        </div>
    );
    return (
        <>
            <Button
                icon="Bug"
                title="Auto fix"
                onClick={() => {
                    setShow(true);
                    editQuery();
                }}
            />
            {show && (
                <Modal
                    onHide={() => {
                        setShow(false);
                        resetState();
                    }}
                    bottomDOM={bottomDOM}
                >
                    {!showDiff && (
                        <div style={{ marginTop: 16 }}>
                            <ThemedCodeHighlightWithMark query={newQuery} />
                        </div>
                    )}
                    {showDiff && (
                        <div style={{ marginTop: 16 }}>
                            <QueryComparison
                                fromQuery={query}
                                toQuery={newQuery}
                                // diff={startDiff}
                            />
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
};

export const AIChartButton = ({ data, meta, onUpdateMeta }) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [show, setShow] = useState(false);
    const [newMeta, setNewMeta] = useState(null);
    const [loading, setLoading] = useState(false);
    const [question, setQuestion] = useState('');

    const askAI = async () => {
        setLoading(true);

        console.log(
            'transformed data',
            JSON.stringify({
                data,
                question: null,
            })
        );
        console.log('meta', meta);
        const response = await fetch('/ds/ai/auto_chart/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data,
                meta,
                question,
            }),
        });
        const { data: config } = await response.json();

        console.log('config', config);
        setNewMeta({
            ...meta,
            chart: {
                ...meta.chart,
                type: config.chartType,
            },
        });
        setLoading(false);
    };

    const onKeyDown = (event: React.KeyboardEvent) => {
        if (matchKeyPress(event, 'Enter')) {
            askAI();
            inputRef.current.blur();
        }
    };

    const resetState = () => {
        setShow(false);
        setQuestion('');
        setNewMeta(null);
    };

    const bottomDOM = newMeta && (
        <div className="right-align mb16">
            <Button
                title="Apply"
                color="confirm"
                onClick={() => {
                    onUpdateMeta?.({ meta: newMeta });
                    setShow(false);
                }}
            />
        </div>
    );

    return (
        <>
            <IconButton
                icon="Stars"
                size={18}
                tooltip="AI: Feeling lucky"
                onClick={() => {
                    setShow(true);
                    askAI();
                }}
            />
            {show && (
                <Modal
                    onHide={() => {
                        setShow(false);
                        resetState();
                    }}
                    bottomDOM={bottomDOM}
                >
                    <div className="AIToolbar" style={{ marginBottom: 16 }}>
                        <span className="StarsIcon">
                            <Icon
                                name={loading ? 'Loading' : 'Stars'}
                                size={18}
                            />
                        </span>
                        <DebouncedInput
                            debounceTime={0}
                            debounceMethod="debounce"
                            onChange={setQuestion}
                            value={question}
                            transparent={false}
                            inputProps={{
                                placeholder:
                                    'Ask AI to generate or edit the query',
                                type: 'text',
                                onKeyDown,
                                ref: inputRef,
                                autoFocus: true,
                            }}
                        />
                    </div>
                    {loading ? (
                        'Generating...'
                    ) : (
                        <DataDocChart data={data} meta={newMeta} />
                    )}
                </Modal>
            )}
        </>
    );
};
