import React, { useCallback, useEffect, useState } from 'react';

import PublicConfig from 'config/querybook_public_config.yaml';
import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { useAISocket } from 'hooks/useAISocket';
import { trackClick } from 'lib/analytics';
import { IconButton } from 'ui/Button/IconButton';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './QueryCellTitle.scss';

const AIAssistantConfig = PublicConfig.ai_assistant;

interface IQueryCellTitleProps {
    cellId: number;
    value: string;
    query: string;
    placeholder: string;
    onChange: (value: string) => any;
    forceSaveQuery: () => Promise<void>;
}

export const QueryCellTitle: React.FC<IQueryCellTitleProps> = ({
    cellId,
    value,
    query,
    placeholder,
    onChange,
    forceSaveQuery,
}) => {
    const titleGenerationEnabled =
        AIAssistantConfig.enabled &&
        AIAssistantConfig.query_title_generation.enabled &&
        query;
    const [title, setTitle] = useState<string>('');

    const socket = useAISocket(AICommandType.SQL_TITLE, ({ data }) => {
        setTitle(data.title);
    });

    useEffect(() => {
        if (title) {
            onChange(title);
        }
    }, [title]);

    const handleTitleGenerationClick = useCallback(async () => {
        // force save the query beforehand, as we're passing the cellId instead of the actual query for title generation
        await forceSaveQuery();

        socket.emit({ query });
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_TITLE_GENERATION_BUTTON,
            aux: {
                cellId,
            },
        });
    }, [socket]);

    return (
        <div className="QueryCellTitle">
            {titleGenerationEnabled && (
                <IconButton
                    icon={socket.loading ? 'Loading' : 'Hash'}
                    size={18}
                    tooltip="AI: generate title"
                    color={!value && query ? 'accent' : undefined}
                    onClick={handleTitleGenerationClick}
                />
            )}
            <ResizableTextArea
                value={value}
                onChange={onChange}
                transparent
                placeholder={socket.loading ? 'Generating...' : placeholder}
                className={`Title ${titleGenerationEnabled ? 'with-icon' : ''}`}
            />
        </div>
    );
};
