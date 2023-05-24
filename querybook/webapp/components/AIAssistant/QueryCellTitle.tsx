import React, { useCallback, useState } from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './QueryCellTitle.scss';

export const QueryCellTitle = ({
    value,
    onChange,
    placeholder,
    onUpdateTitle,
    query,
}) => {
    const [loading, setLoading] = useState(false);

    const generateTitle = useCallback(
        async (query) => {
            onUpdateTitle?.('');
            setLoading(true);
            const response = await fetch('/ds/ai/query_title/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({
                    query,
                    stream: true,
                }),
            });

            // Create a new TextDecoder to decode the streamed response text
            const decoder = new TextDecoder();
            // Set up a new ReadableStream to read the response body
            const reader = response.body.getReader();

            let data = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    setLoading(false);
                    break;
                }
                data += decoder.decode(value);
                onUpdateTitle?.(data);
            }
        },
        [onUpdateTitle]
    );

    return (
        <div className="QueryCellTitle">
            {!!query && (
                <IconButton
                    icon={loading ? 'Loading' : 'Hash'}
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
                placeholder={loading ? 'Generating...' : placeholder}
                className={`Title ${!!query ? 'with-icon' : ''}`}
            />
        </div>
    );
};
