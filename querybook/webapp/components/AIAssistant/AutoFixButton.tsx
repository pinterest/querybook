import React, { useState } from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { ComponentType, ElementType } from 'const/analytics';
import { StreamStatus, useStream } from 'hooks/useStream';
import { trackClick } from 'lib/analytics';
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

    const { streamStatus, startStream, streamData } = useStream(
        '/ds/ai/query_auto_fix/',
        {
            query_execution_id: queryExecutionId,
        }
    );

    const {
        explanation,
        fix_suggestion: suggestion,
        fixed_query: fixedQuery,
    } = streamData;

    const bottomDOM = fixedQuery && (
        <div className="right-align mb16">
            <Button
                title="Reject"
                color="cancel"
                onClick={() => {
                    setShow(false);
                }}
            />
            <Button
                title="Apply"
                color="confirm"
                onClick={() => {
                    onUpdateQuery?.(fixedQuery);
                    trackClick({
                        component: ComponentType.AI_ASSISTANT,
                        element: ElementType.QUERY_ERROR_AUTO_FIX_APPLY_BUTTON,
                    });
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
                    if (streamStatus === StreamStatus.NOT_STARTED) {
                        startStream();
                        trackClick({
                            component: ComponentType.AI_ASSISTANT,
                            element: ElementType.QUERY_ERROR_AUTO_FIX_BUTTON,
                        });
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
                        message="Note: This AI-powered auto fix may not be 100% accurate. Please use your own judgement and verify the result."
                        type="warning"
                    />
                    {streamStatus === StreamStatus.NOT_STARTED && (
                        <AccentText>Thinking...</AccentText>
                    )}
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
                                disableHighlight={
                                    streamStatus === StreamStatus.STREAMING
                                }
                            />
                        </div>
                    )}
                </Modal>
            )}
        </>
    );
};
