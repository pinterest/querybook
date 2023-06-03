import React, { useCallback, useState } from 'react';

import AIAssistantConfig from 'config/ai_assistant.yaml';
import ds from 'lib/datasource';
import { IconButton } from 'ui/Button/IconButton';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';

import './QueryCellTitle.scss';

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
    const [generating, setGenerating] = useState(false);

    const titleGenerationEnabled =
        AIAssistantConfig.provider &&
        AIAssistantConfig.query_title_generation.enabled &&
        query;

    const generateTitle = useCallback(
        (query) => {
            onChange('');
            setGenerating(true);

            ds.stream(
                '/ds/ai/query_title/',
                {
                    query,
                },
                onChange,
                () => setGenerating(false)
            );
        },
        [onChange]
    );

    return (
        <div className="QueryCellTitle">
            {titleGenerationEnabled && (
                <IconButton
                    icon={generating ? 'Loading' : 'Hash'}
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
                placeholder={generating ? 'Generating...' : placeholder}
                className={`Title ${titleGenerationEnabled ? 'with-icon' : ''}`}
            />
        </div>
    );
};
