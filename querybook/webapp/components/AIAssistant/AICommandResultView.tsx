import React, { useCallback, useEffect, useState } from 'react';

import { TableSelector } from 'components/AIAssistant/TableSelector';
import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ComponentType, ElementType } from 'const/analytics';
import { IQueryCellCommand } from 'const/command';
import useNonEmptyState from 'hooks/useNonEmptyState';
import { trackClick } from 'lib/analytics';
import { Button } from 'ui/Button/Button';
import { SurveySurfaceType } from 'const/survey';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';

interface IAICommandResultViewProps {
    command: IQueryCellCommand;
    commandKwargs: Record<string, any>;
    metastoreId: number;
    originalQuery: string;
    tables: string[];
    hasMentionedTables: boolean;
    commandResult: Record<string, any>;
    isStreaming: boolean;
    onContinue: () => void;
    onTablesChange: (tables: string[]) => void;
    onAccept: (query: string) => void;
    onDiscard: () => void;
}

export const AICommandResultView = ({
    command,
    commandKwargs,
    metastoreId,
    originalQuery,
    tables,
    hasMentionedTables,
    commandResult = {},
    isStreaming,
    onContinue,
    onTablesChange,
    onAccept,
    onDiscard,
}: IAICommandResultViewProps) => {
    const [newQuery, setNewQuery] = useNonEmptyState<string>('');
    const [explanation, setExplanation] = useState<string>('');
    const [foundTables, setFoundTables] = useState<boolean>(false);

    useEffect(() => {
        const { type, data = {} } = commandResult;

        if (type === 'tables') {
            onTablesChange(data);
            setFoundTables(true);
        } else {
            const {
                explanation,
                query: rawNewQuery,
                data: additionalData,
            } = data;
            setExplanation(explanation || additionalData);
            setNewQuery(rawNewQuery);
            setFoundTables(false);
        }
    }, [commandResult]);

    const triggerSurvey = useSurveyTrigger();
    useEffect(() => {
        if (!newQuery || isStreaming) {
            return;
        }
        triggerSurvey(SurveySurfaceType.TEXT_TO_SQL, {
            question: commandKwargs.question,
            tables,
            query: newQuery,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newQuery, triggerSurvey, isStreaming]);

    const handleAccept = useCallback(() => {
        onAccept(newQuery);
        trackClick({
            component: ComponentType.AI_ASSISTANT,
            element: ElementType.QUERY_GENERATION_APPLY_BUTTON,
            aux: {
                mode: command.name,
                question: commandKwargs.question,
                tables,
                query: newQuery,
            },
        });
    }, [onAccept, newQuery]);

    const handleDiscard = useCallback(() => {
        onDiscard();
        if (newQuery) {
            trackClick({
                component: ComponentType.AI_ASSISTANT,
                element: ElementType.QUERY_GENERATION_REJECT_BUTTON,
                aux: {
                    mode: command.name,
                    question: commandKwargs.question,
                    tables,
                    query: newQuery,
                },
            });
        }
    }, [onAccept, newQuery]);

    const tablesDOM = (
        <div className="mt12">
            <div>Please review table(s) to use for the query</div>
            <TableSelector
                metastoreId={metastoreId}
                tableNames={tables}
                onTableNamesChange={(tables) => {
                    onTablesChange(tables);
                    setFoundTables(true);
                }}
            />
            {foundTables && tables.length > 0 && (
                <div className="mt12">
                    <Button
                        title="Continue"
                        onClick={onContinue}
                        color="accent"
                    />
                </div>
            )}
        </div>
    );

    const queryDiffDOM = (originalQuery || newQuery) && (
        <div className="mt12">
            <QueryComparison
                fromQuery={originalQuery}
                toQuery={newQuery}
                fromQueryTitle="Original Query"
                toQueryTitle="New Query"
                disableHighlight={isStreaming}
                hideEmptyQuery={true}
                autoHeight={true}
            />
        </div>
    );

    const actionButtonsDOM = newQuery && !isStreaming && (
        <div className="right-align mt12">
            <Button title="Accept" onClick={handleAccept} color="confirm" />
            <Button title="Discard" onClick={handleDiscard} />
        </div>
    );

    return (
        <div>
            {!hasMentionedTables && tablesDOM}
            {explanation && <div className="mt12">{explanation}</div>}
            {queryDiffDOM}
            {actionButtonsDOM}
        </div>
    );
};
