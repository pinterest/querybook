import React, { useEffect, useState } from 'react';

import { AICommandResultView } from 'components/AIAssistant/AICommandResultView';
import { SurveySurfaceType } from 'const/survey';
import { useSurveyTrigger } from 'hooks/ui/useSurveyTrigger';
import {
    AIRequestKind,
    footerActions,
    IAIRequest,
    ITextToSqlResult,
} from 'hooks/useAICommandSession';
import { matchKeyPress } from 'lib/utils/keyboard';
import { Button } from 'ui/Button/Button';
import { Message } from 'ui/Message/Message';
import { Modal } from 'ui/Modal/Modal';
import { ResizableTextArea } from 'ui/ResizableTextArea/ResizableTextArea';
import { StyledText } from 'ui/StyledText/StyledText';

const MODAL_TITLES: Record<AIRequestKind, string> = {
    generate: 'Generate query',
    edit: 'Edit query',
    revise: 'Revise query',
};

interface IAICommandModalProps {
    request: IAIRequest;
    result: ITextToSqlResult;
    isStreaming: boolean;
    metastoreId: number;
    originalQuery: string;
    tables: string[];
    hasMentionedTables: boolean;
    onTablesChange: (tables: string[]) => void;
    onContinue: () => void;
    onRequestChanges: (requestedChanges: string) => void;
    onAccept: () => void;
    onReject: () => void;
    onDismiss: () => void;
}

export const AICommandModal = ({
    request,
    result,
    isStreaming,
    metastoreId,
    originalQuery,
    tables,
    hasMentionedTables,
    onTablesChange,
    onContinue,
    onRequestChanges,
    onAccept,
    onReject,
    onDismiss,
}: IAICommandModalProps) => {
    const [requestedChanges, setRequestedChanges] = useState('');
    const actions = footerActions(result, isStreaming);
    const newQuery = result?.kind === 'query' ? result.query : '';

    const triggerSurvey = useSurveyTrigger();
    useEffect(() => {
        if (!newQuery || isStreaming) {
            return;
        }
        triggerSurvey(SurveySurfaceType.TEXT_TO_SQL, {
            question: request.question,
            tables,
            query: newQuery,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newQuery, triggerSurvey, isStreaming]);

    const submitRequestedChanges = () => {
        const text = requestedChanges.trim();
        if (text) {
            onRequestChanges(text);
        }
    };

    const headerDOM = (
        <>
            <Message
                message="Note: This AI-powered query generation may be inaccurate. Please use your own judgement and verify the result."
                type="warning"
            />
            {request.question && (
                <div className="mt12">
                    <StyledText weight="bold">Question:</StyledText>{' '}
                    {request.question}
                </div>
            )}
            {request.kind === 'revise' && (
                <div className="mt4">
                    <StyledText weight="bold">Requested changes:</StyledText>{' '}
                    {request.requestedChanges}
                </div>
            )}
        </>
    );

    const footerDOM = (
        <div className="AICommandModal-footer">
            {actions.generating && (
                <div className="right-align">
                    <span className="AICommandModal-status">Generating...</span>
                </div>
            )}
            {actions.requestChanges && (
                <div className="AICommandModal-request-changes">
                    <StyledText weight="bold">Request changes</StyledText>
                    <div className="AICommandModal-request-changes-row mt4">
                        <div className="AICommandModal-request-changes-input">
                            <ResizableTextArea
                                value={requestedChanges}
                                onChange={setRequestedChanges}
                                placeholder="Describe what to change in the new query"
                                rows={2}
                                autoResize={false}
                                onKeyDown={(event) => {
                                    if (
                                        matchKeyPress(event, 'Enter') &&
                                        !event.shiftKey
                                    ) {
                                        event.preventDefault();
                                        submitRequestedChanges();
                                    }
                                }}
                            />
                        </div>
                        <Button
                            className="AICommandModal-request-changes-submit ml8"
                            title="Submit"
                            color="accent"
                            disabled={!requestedChanges.trim()}
                            onClick={submitRequestedChanges}
                        />
                    </div>
                </div>
            )}
            {!actions.generating && (
                <div className="right-align">
                    {actions.accept && (
                        <Button
                            title="Accept"
                            onClick={onAccept}
                            color="confirm"
                        />
                    )}
                    {actions.reject && (
                        <Button
                            title="Reject"
                            onClick={onReject}
                            color="cancel"
                        />
                    )}
                    {actions.dismiss && (
                        <Button title="Dismiss" onClick={onDismiss} />
                    )}
                </div>
            )}
        </div>
    );

    return (
        <Modal
            className="AICommandModal"
            title={MODAL_TITLES[request.kind]}
            onHide={onDismiss}
            bottomDOM={footerDOM}
        >
            {headerDOM}
            <AICommandResultView
                metastoreId={metastoreId}
                originalQuery={originalQuery}
                tables={tables}
                hasMentionedTables={hasMentionedTables}
                result={result}
                isStreaming={isStreaming}
                onContinue={onContinue}
                onTablesChange={onTablesChange}
            />
        </Modal>
    );
};
