import React, { useState } from 'react';

import PublicConfig from 'config/querybook_public_config.yaml';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryEngine } from 'const/queryEngine';
import { trackClick } from 'lib/analytics';
import { IconButton } from 'ui/Button/IconButton';

import { QueryGenerationModal } from './QueryGenerationModal';

const AIAssistantConfig = PublicConfig.ai_assistant;

interface IProps {
    dataCellId: number;
    query: string;
    engineId: number;
    queryEngines: IQueryEngine[];
    queryEngineById: Record<number, IQueryEngine>;
    onUpdateQuery: (query: string, run: boolean) => void;
    onUpdateEngineId: (engineId: number) => void;
}

export const QueryGenerationButton = ({
    dataCellId,
    query = '',
    engineId,
    queryEngines,
    queryEngineById,
    onUpdateQuery,
    onUpdateEngineId,
}: IProps) => {
    const [show, setShow] = useState(false);

    return (
        <>
            {AIAssistantConfig.enabled &&
                AIAssistantConfig.query_generation.enabled && (
                    <IconButton
                        className="QueryGenerationButton"
                        icon="Stars"
                        size={18}
                        tooltip="AI: generate/edit query"
                        color={!query ? 'accent' : undefined}
                        onClick={() => {
                            setShow(true);
                            trackClick({
                                component: ComponentType.AI_ASSISTANT,
                                element:
                                    ElementType.QUERY_GENERATION_MODAL_OPEN_BUTTON,
                            });
                        }}
                    />
                )}
            {show && (
                <QueryGenerationModal
                    dataCellId={dataCellId}
                    query={query}
                    engineId={engineId}
                    queryEngines={queryEngines}
                    queryEngineById={queryEngineById}
                    onUpdateQuery={onUpdateQuery}
                    onUpdateEngineId={onUpdateEngineId}
                    onHide={() => setShow(false)}
                />
            )}
        </>
    );
};
