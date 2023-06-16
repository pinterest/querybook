import React, { useCallback, useState } from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import ds from 'lib/datasource';
import { Button } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { AccentText } from 'ui/StyledText/StyledText';

interface IProps {
    query: string;
    queryExecutionId: number;
    onUpdateQuery?: (query: string) => any;
}

export const AutoFixButton = ({
    query,
    queryExecutionId,
    onUpdateQuery,
}: IProps) => {
    const [show, setShow] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const [response, setResponse] = useState<{
        explanation: string;
        suggestion: string;
        fixedQuery: string;
    } | null>(null);

    const { explanation, suggestion, fixedQuery } = response ?? {};

    const handleClickAutoFix = useCallback(async () => {
        setIsStreaming(true);

        ds.stream(
            '/ds/ai/query_auto_fix/',
            {
                query_execution_id: queryExecutionId,
            },
            (data) => {
                setResponse({
                    explanation: data['explanation'] ?? '',
                    suggestion: data['fix_suggestion'] ?? '',
                    fixedQuery: data['fixed_query'] ?? '',
                });
            },
            () => {
                setIsStreaming(false);
            }
        );
    }, [queryExecutionId]);

    const bottomDOM = response?.fixedQuery && (
        <div className="right-align mb16">
            <Button
                title="Cancel"
                color="cancel"
                onClick={() => {
                    setShow(false);
                }}
            />
            <Button
                title="Apply"
                color="confirm"
                onClick={() => {
                    onUpdateQuery?.(response?.fixedQuery);
                    setShow(false);
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
                    if (!response) {
                        handleClickAutoFix();
                    }
                }}
            />
            {show && (
                <Modal
                    onHide={() => {
                        setShow(false);
                    }}
                    bottomDOM={bottomDOM}
                >
                    <Message
                        message="Note: This AI-powered auto fix may not always be 100% accurate. Please use your own judgement and verify the result."
                        type="warning"
                    />
                    {!response && <AccentText>Thinking...</AccentText>}
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
                                fromTag="Original"
                                toTag="Fixed"
                                highlight={!isStreaming}
                            />
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
};
