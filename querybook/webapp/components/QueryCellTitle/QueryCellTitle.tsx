import React, { useCallback, useEffect } from 'react';
import { useDispatch } from 'react-redux';

import PublicConfig from 'config/querybook_public_config.yaml';
import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { StreamStatus, useStream } from 'hooks/useStream';
import { trackClick } from 'lib/analytics';
import { trimQueryTitle } from 'lib/stream';
import { Dispatch } from 'redux/store/types';
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
    const dispatch: Dispatch = useDispatch();
    const titleGenerationEnabled =
        AIAssistantConfig.enabled &&
        AIAssistantConfig.query_title_generation.enabled &&
        query;

    const { streamStatus, startStream, streamData } = useStream(
        AICommandType.SQL_TITLE,
        {
            data_cell_id: cellId,
        }
    );
    const { data: title } = streamData;

    useEffect(() => {
        if (streamStatus !== StreamStatus.NOT_STARTED && title) {
            onChange(trimQueryTitle(title));
        }
    }, [streamStatus, title]);

    const handleTitleGenerationClick = useCallback(async () => {
        // force save the query beforehand, as we're passing the cellId instead of the actual query for title generation
        await forceSaveQuery();

        startStream();
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_TITLE_GENERATION_BUTTON,
            aux: {
                cellId,
            },
        });
    }, [startStream]);

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
                    onClick={handleTitleGenerationClick}
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
