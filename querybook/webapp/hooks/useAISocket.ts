import { uniqueId } from 'lodash';
import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { AICommandType, AISocketEvent } from 'const/aiAssistant';
import aiAssistantSocket from 'lib/ai-assistant/ai-assistant-socketio';

export interface AISocket {
    loading: boolean;
    failed: boolean;
    emit: (payload: object) => void;
    cancel: () => void;
}

export function useAISocket(
    commandType: AICommandType,
    onData: (data: { type?: string; data: { [key: string]: string } }) => void
): AISocket {
    const [loading, setLoading] = useState(false);
    const [failed, setFailed] = useState(false);
    const requestIdRef = useRef<string>();
    const onDataRef = useRef(onData);
    onDataRef.current = onData;

    const eventHandler = useCallback((event, payload, requestId) => {
        if (requestId !== requestIdRef.current) {
            return;
        }

        switch (event) {
            case AISocketEvent.DATA:
                onDataRef.current({ type: 'data', data: payload });
                break;

            case AISocketEvent.TABLES:
                onDataRef.current({ type: 'tables', data: payload });
                break;

            case AISocketEvent.CLOSE:
                close();
                break;

            case AISocketEvent.ERROR:
                toast.error(payload);
                setFailed(true);
                close();
                break;
            default:
                console.error('Unknown ai websocket event', event);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const close = useCallback(() => {
        aiAssistantSocket.removeListener(commandType, eventHandler);
        aiAssistantSocket.removeListener('error', onError);
        setLoading(false);
    }, [aiAssistantSocket, commandType, eventHandler]);

    const onError = useCallback(
        (error: string) => {
            toast.error(error);
            setFailed(true);
            close();
        },
        [close]
    );

    const emit = useCallback(
        (params) => {
            aiAssistantSocket.removeListener(commandType, eventHandler);
            aiAssistantSocket.removeListener('error', onError);

            requestIdRef.current = uniqueId('ai_request_');
            aiAssistantSocket.addListener('error', onError);
            aiAssistantSocket.addListener(commandType, eventHandler);
            aiAssistantSocket.emit(commandType, {
                ...params,
                request_id: requestIdRef.current,
            });
            setLoading(true);
            setFailed(false);
        },
        [commandType, eventHandler, onError]
    );

    return {
        loading,
        failed,
        emit,
        cancel: close,
    };
}
