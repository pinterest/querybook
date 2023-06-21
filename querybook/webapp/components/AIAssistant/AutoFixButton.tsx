import React, { useCallback, useState } from 'react';

import { QueryComparison } from 'components/TranspileQueryModal/QueryComparison';
import { useStream } from 'hooks/useStream';
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

    const { isStreaming, startStream, data } = useStream(
        '/ds/ai/query_auto_fix/',
        {
            query_execution_id: queryExecutionId,
        }
    );

    const {
        explanation,
        fix_suggestion: suggestion,
        fixed_query: fixedQuery,
    } = data || {};

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
                    if (!data) {
                        startStream();
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
                    {!data && <AccentText>Thinking...</AccentText>}
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
