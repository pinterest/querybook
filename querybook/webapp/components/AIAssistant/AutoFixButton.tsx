import React, { useEffect, useState } from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { useAISocket } from 'hooks/useAISocket';
import useNonEmptyState from 'hooks/useNonEmptyState';
import { trackClick } from 'lib/analytics';
import { Button } from 'ui/Button/Button';
import { Loading, LoadingIcon } from 'ui/Loading/Loading';
import { Markdown } from 'ui/Markdown/Markdown';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';

import './AutoFixButton.scss';

interface IProps {
    query: string;
    queryExecutionId: number;
    onUpdateQuery?: (query: string, run?: boolean) => any;
}

const useSQLFix = () => {
    const [data, setData] = useState<{ [key: string]: string }>({});
    const [fixedQuery, setFixedQuery] = useNonEmptyState<string>('');

    const socket = useAISocket(AICommandType.SQL_FIX, ({ data }) => {
        setData(data as { [key: string]: string });
    });

    const {
        data: unformattedData,
        explanation,
        fix_suggestion: suggestion,
        diagnosis,
        fixed_query: newFixedQuery,
    } = data;

    useEffect(() => {
        setFixedQuery(newFixedQuery);
    }, [newFixedQuery]);

    return {
        socket,
        fixed: Object.keys(data).length > 0, // If has data, then it has been fixed
        diagnosis: diagnosis || unformattedData,
        explanation: explanation,
        suggestion,
        fixedQuery,
    };
};

export const AutoFixButton = ({
    query,
    queryExecutionId,
    onUpdateQuery,
}: IProps) => {
    const [showModal, setShowModal] = useState<boolean>(false);
    const { socket, fixed, diagnosis, explanation, suggestion, fixedQuery } =
        useSQLFix();

    const bottomDOM = socket.loading ? (
        <div className="right-align mb16">
            <Button
                title="Stop Generating"
                color="light"
                onClick={socket.cancel}
                className="mr8"
            />
        </div>
    ) : (
        <div className="right-align mb16">
            <Button
                title="Unhelpful"
                onClick={() => {
                    setShowModal(false);
                }}
            />
            <Button
                title={fixedQuery ? "Apply" : "Helpful"}
                color="confirm"
                onClick={() => {
                    if (fixedQuery) {
                        onUpdateQuery?.(fixedQuery, false);
                    }
                    trackClick({
                        component: ComponentType.AI_ASSISTANT,
                        element: ElementType.QUERY_ERROR_AUTO_FIX_APPLY_BUTTON,
                    });
                    setShowModal(false);
                }}
            />
            {fixedQuery && (
                <Button
                    title="Apply and Run"
                    color="accent"
                    onClick={() => {
                        onUpdateQuery?.(fixedQuery, true);
                        trackClick({
                            component: ComponentType.AI_ASSISTANT,
                            element:
                                ElementType.QUERY_ERROR_AUTO_FIX_APPLY_AND_RUN_BUTTON,
                        });
                        setShowModal(false);
                    }}
                />
            )}
        </div>
    );
    return (
        <>
            <Button
                icon="Bug"
                title="Auto fix"
                onClick={() => {
                    setShowModal(true);
                    if (!fixed) {
                        socket.emit({
                            query_execution_id: queryExecutionId,
                        });
                        trackClick({
                            component: ComponentType.AI_ASSISTANT,
                            element: ElementType.QUERY_ERROR_AUTO_FIX_BUTTON,
                            aux: {
                                queryExecutionId,
                            },
                        });
                    }
                }}
            />
            {showModal && (
                <Modal
                    onHide={() => {
                        socket.cancel();
                        setShowModal(false);
                    }}
                    bottomDOM={bottomDOM}
                    className="AutoFixModal"
                >
                    <Message
                        message="Note: This AI-powered auto fix may not be 100% accurate. Please use your own judgement and verify the result."
                        type="warning"
                    />
                    {socket.loading && (
                        <div className="flex-row">
                            <LoadingIcon />
                            <div>Diagnosing...</div>
                        </div>
                    )}
                    {diagnosis && <Markdown>{diagnosis}</Markdown>}
                    {explanation && (
                        <div>
                            <AccentText size="med" weight="bold">
                                Explanation
                            </AccentText>
                            <AccentText>{explanation}</AccentText>
                        </div>
                    )}
                    {suggestion && (
                        <div className="mt16">
                            <AccentText size="med" weight="bold">
                                Suggestion
                            </AccentText>
                            <AccentText>{suggestion}</AccentText>
                        </div>
                    )}
                    {fixedQuery && (
                        <div style={{ marginTop: 16 }}>
                            <QueryComparison
                                fromQuery={query}
                                toQuery={fixedQuery}
                                fromQueryTitle="Original"
                                toQueryTitle="Fixed"
                                disableHighlight={socket.loading}
                            />
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
};
