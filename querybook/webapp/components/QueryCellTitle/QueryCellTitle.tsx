import React, { useEffect } from 'react';

import PublicConfig from 'config/querybook_public_config.yaml';
import { StreamStatus, useStream } from 'hooks/useStream';
import { IconButton } from 'ui/Button/IconButton';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './QueryCellTitle.scss';

const AIAssistantConfig = PublicConfig.ai_assistant;

interface IQueryCellTitleProps {
    value: string;
    query: string;
    placeholder: string;
    onChange: (value: string) => any;
}

export const QueryCellTitle: React.FC<IQueryCellTitleProps> = ({
    value,
    query,
    placeholder,
    onChange,
}) => {
    const titleGenerationEnabled =
        AIAssistantConfig.enabled &&
        AIAssistantConfig.query_title_generation.enabled &&
        query;

    const { streamStatus, startStream, streamData } = useStream(
        '/ds/ai/query_title/',
        {
            query,
        }
    );
    const { data: title } = streamData;

    useEffect(() => {
        onChange(title);
    }, [title]);

    return (
        <div className="QueryCellTitle">
            {titleGenerationEnabled && (
                <IconButton
                    icon={
                        streamStatus === StreamStatus.STREAMING
                            ? 'Loading'
                            : 'Hash'
                    }
                    size={18}
                    tooltip="AI: generate title"
                    color={!value && query ? 'accent' : undefined}
                    onClick={startStream}
                />
            )}
            <ResizableTextArea
                value={value}
                onChange={onChange}
                transparent
                placeholder={
                    streamStatus === StreamStatus.STREAMING
                        ? 'Generating...'
                        : placeholder
                }
                className={`Title ${titleGenerationEnabled ? 'with-icon' : ''}`}
            />
        </div>
    );
};
