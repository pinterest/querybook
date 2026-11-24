import { truncate } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { AICommandType } from 'const/aiAssistant';
import { ComponentType, ElementType } from 'const/analytics';
import { useAISocket } from 'hooks/useAISocket';
import { trackClick } from 'lib/analytics';
import { Button } from 'ui/Button/Button';

export type AIRequestKind = 'generate' | 'edit' | 'revise';

export interface IAIRequest {
    kind: AIRequestKind;
    question: string;
    originalQuery: string;
    tables: string[];
    proposedQuery?: string;
    requestedChanges?: string;
}

export interface ITextToSqlResult {
    kind: 'tables' | 'query';
    tables?: string[];
    query?: string;
    explanation?: string;
}

export interface IFooterActions {
    generating: boolean;
    requestChanges: boolean;
    accept: boolean;
    reject: boolean;
    dismiss: boolean;
}

export function parseTextToSqlResult(commandResult: {
    type?: string;
    data?: any;
}): ITextToSqlResult | null {
    if (!commandResult) {
        return null;
    }
    const { type, data = {} } = commandResult;
    if (type === 'tables') {
        return { kind: 'tables', tables: data };
    }
    return {
        kind: 'query',
        query: data.query || '',
        explanation: data.explanation || data.data || '',
    };
}

const hasQuery = (result: ITextToSqlResult) =>
    result?.kind === 'query' && !!result.query;

export function footerActions(
    result: ITextToSqlResult,
    streaming: boolean
): IFooterActions {
    if (streaming) {
        return {
            generating: true,
            requestChanges: false,
            accept: false,
            reject: false,
            dismiss: false,
        };
    }
    const finished = !!result;
    return {
        generating: false,
        requestChanges: hasQuery(result),
        accept: hasQuery(result),
        reject: finished,
        dismiss: true,
    };
}

export function readyToastText(
    request: IAIRequest,
    result: ITextToSqlResult
): string {
    const quoted = truncate(
        request.kind === 'revise' ? request.requestedChanges : request.question,
        { length: 60 }
    );
    return result?.kind === 'tables'
        ? `AI needs you to pick tables for "${quoted}"`
        : `AI response ready for "${quoted}"`;
}

function toSocketPayload(queryEngineId: number, request: IAIRequest) {
    const payload: Record<string, any> = {
        query_engine_id: queryEngineId,
        tables: request.tables,
        question: request.question,
        original_query: request.originalQuery ?? '',
    };
    if (request.kind === 'revise') {
        payload.proposed_query = request.proposedQuery;
        payload.requested_changes = request.requestedChanges;
    }
    return payload;
}

interface IUseAICommandSessionOptions {
    queryEngineId: number;
    onTablesSuggested: (tables: string[]) => void;
    onAccept: (query: string) => void;
}

/**
 * One text-to-SQL session for an AI command bar: runs requests in the
 * background, keeps the last finished result, and owns the ready toast.
 *
 * It uses the TEXT_TO_SQL socket directly, with a fixed command type, so
 * switching the inline command (for example to /format) can't drop a
 * running request.
 */
export function useAICommandSession({
    queryEngineId,
    onTablesSuggested,
    onAccept,
}: IUseAICommandSessionOptions) {
    const [request, setRequest] = useState<IAIRequest>(null);
    const [completed, setCompleted] = useState<ITextToSqlResult>(null);
    const [streamed, setStreamed] = useState<ITextToSqlResult>(null);
    const [modalOpen, setModalOpen] = useState(false);

    const stoppedRef = useRef(false);
    const toastIdRef = useRef<string>(null);
    const streamedRef = useRef<ITextToSqlResult>(null);
    streamedRef.current = streamed;
    const modalOpenRef = useRef(modalOpen);
    modalOpenRef.current = modalOpen;
    const onTablesSuggestedRef = useRef(onTablesSuggested);
    onTablesSuggestedRef.current = onTablesSuggested;

    const onData = useCallback((data) => {
        const parsed = parseTextToSqlResult(data);
        if (parsed?.kind === 'tables') {
            onTablesSuggestedRef.current(parsed.tables);
        }
        // Streamed updates can briefly have an empty query; keep the last one.
        setStreamed((previous) =>
            parsed?.kind === 'query' && !parsed.query && hasQuery(previous)
                ? { ...parsed, query: previous.query }
                : parsed
        );
    }, []);

    const socket = useAISocket(AICommandType.TEXT_TO_SQL, onData);
    const { emit: socketEmit, cancel: socketCancel } = socket;

    const dismissToast = useCallback(() => {
        if (toastIdRef.current) {
            toast.dismiss(toastIdRef.current);
            toastIdRef.current = null;
        }
    }, []);

    const track = useCallback(
        (element: ElementType, aux: Record<string, any>) =>
            trackClick({ component: ComponentType.AI_ASSISTANT, element, aux }),
        []
    );

    const view = useCallback(() => {
        dismissToast();
        setModalOpen(true);
        track(ElementType.QUERY_GENERATION_VIEW_BUTTON, {
            mode: request?.kind,
        });
    }, [dismissToast, track, request]);

    const viewRef = useRef(view);
    viewRef.current = view;

    const emit = useCallback(
        (nextRequest: IAIRequest) => {
            stoppedRef.current = false;
            setStreamed(null);
            setRequest(nextRequest);
            socketEmit(toSocketPayload(queryEngineId, nextRequest));
            track(ElementType.QUERY_GENERATION_BUTTON, {
                mode: nextRequest.kind,
                question:
                    nextRequest.kind === 'revise'
                        ? nextRequest.requestedChanges
                        : nextRequest.question,
                tables: nextRequest.tables,
            });
        },
        [socketEmit, queryEngineId, track]
    );

    // The request that produced `completed`. When a request ends without a
    // new result, the kept result is shown with the request that produced it.
    const completedRequestRef = useRef<IAIRequest>(null);
    const keepPreviousResult = () => {
        if (completed) {
            setRequest(completedRequestRef.current);
        }
    };

    const wasLoadingRef = useRef(false);
    useEffect(() => {
        const wasLoading = wasLoadingRef.current;
        wasLoadingRef.current = socket.loading;
        if (!wasLoading || socket.loading) {
            return;
        }
        if (stoppedRef.current) {
            stoppedRef.current = false;
            keepPreviousResult();
            return;
        }
        // useAISocket sets `failed` before it sets `loading` to false, and
        // React 17 doesn't batch socket callbacks, so `failed` is already
        // up to date here.
        if (socket.failed) {
            setModalOpen(false);
            keepPreviousResult();
            return;
        }

        const result = streamedRef.current;
        if (request?.kind === 'revise' && result?.kind !== 'tables') {
            if (!hasQuery(result)) {
                toast.error(
                    result?.explanation ||
                        'The AI could not revise the query. Please try again.'
                );
                keepPreviousResult();
                return;
            }
        }
        completedRequestRef.current = request;
        setCompleted(result);
        if (result && !modalOpenRef.current) {
            dismissToast();
            toastIdRef.current = toast.success(
                <div className="AICommandReadyToast flex-row">
                    <span className="AICommandReadyToast-text">
                        {readyToastText(request, result)}
                    </span>
                    <Button
                        className="ml8"
                        title="View"
                        size="small"
                        onClick={() => viewRef.current()}
                    />
                    <Button
                        className="ml4"
                        title="Dismiss"
                        size="small"
                        theme="text"
                        onClick={dismissToast}
                    />
                </div>,
                { duration: Infinity }
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [socket.loading]);

    const loadingRef = useRef(socket.loading);
    loadingRef.current = socket.loading;
    const cancelRef = useRef(socketCancel);
    cancelRef.current = socketCancel;
    useEffect(
        () => () => {
            if (toastIdRef.current) {
                toast.dismiss(toastIdRef.current);
            }
            if (loadingRef.current) {
                stoppedRef.current = true;
                cancelRef.current();
            }
        },
        []
    );

    const submit = useCallback(
        (
            nextRequest: Omit<IAIRequest, 'kind'> & {
                kind: 'generate' | 'edit';
            }
        ) => {
            dismissToast();
            setCompleted(null);
            setModalOpen(false);
            emit(nextRequest);
        },
        [dismissToast, emit]
    );

    const requestChanges = useCallback(
        (requestedChanges: string, tables: string[]) => {
            if (!request || !hasQuery(completed)) {
                return;
            }
            dismissToast();
            setModalOpen(false);
            emit({
                kind: 'revise',
                question: request.question,
                originalQuery: request.originalQuery,
                tables,
                proposedQuery: completed.query,
                requestedChanges,
            });
        },
        [request, completed, dismissToast, emit]
    );

    const continueRequest = useCallback(
        (tables: string[]) => {
            if (request) {
                emit({ ...request, tables });
            }
        },
        [request, emit]
    );

    const cancel = useCallback(() => {
        stoppedRef.current = true;
        socketCancel();
    }, [socketCancel]);

    const trackResult = useCallback(
        (element: ElementType) =>
            track(element, {
                mode: request?.kind,
                question: request?.question,
                tables: request?.tables,
                query: completed?.query,
            }),
        [track, request, completed]
    );

    const accept = useCallback(() => {
        if (!hasQuery(completed)) {
            return;
        }
        onAccept(completed.query);
        trackResult(ElementType.QUERY_GENERATION_APPLY_BUTTON);
        dismissToast();
        setCompleted(null);
        setModalOpen(false);
    }, [completed, onAccept, trackResult, dismissToast]);

    const reject = useCallback(() => {
        trackResult(ElementType.QUERY_GENERATION_REJECT_BUTTON);
        dismissToast();
        setCompleted(null);
        setModalOpen(false);
    }, [trackResult, dismissToast]);

    const dismiss = useCallback(() => {
        setModalOpen(false);
        track(ElementType.QUERY_GENERATION_DISMISS_BUTTON, {
            mode: request?.kind,
        });
    }, [track, request]);

    const isStreaming = socket.loading && modalOpen;

    return {
        request,
        result: isStreaming ? streamed : completed,
        isRunning: socket.loading,
        isStreaming,
        modalOpen,
        hasUnviewedResult: !socket.loading && !!completed && !modalOpen,
        submit,
        requestChanges,
        continueRequest,
        view,
        dismiss,
        accept,
        reject,
        cancel,
    };
}
