import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { AICommandType, AISocketEvent } from 'const/aiAssistant';
import aiAssistantSocket from 'lib/ai-assistant/ai-assistant-socketio';
import { DeltaStreamParser } from 'lib/stream';

export interface AISocket {
    loading: boolean;
    emit: (payload: object) => void;
    cancel: () => void;
}

export function useAISocket(
    commandType: AICommandType,
    onData: (data: { type?: string; data: { [key: string]: string } }) => void
): AISocket {
    const [loading, setLoading] = useState(false);

    const deltaStreamParserRef = useRef<DeltaStreamParser>(
        new DeltaStreamParser()
    );

    const eventHandler = useCallback(
        (event, payload) => {
            const parser = deltaStreamParserRef.current;
            switch (event) {
                case AISocketEvent.DATA:
                    onData({ data: { data: payload } });
                    break;

                case AISocketEvent.DELTA_DATA:
                    parser.parse(payload);
                    onData({ data: parser.result });
                    break;

                case AISocketEvent.DELTA_END:
                    parser.close();
                    onData({ data: parser.result });
                    break;

                case AISocketEvent.TABLES:
                    onData({ type: 'tables', data: payload });
                    break;

                case AISocketEvent.CLOSE:
                    close();
                    break;

                case AISocketEvent.ERROR:
                    toast.error(payload);
                    close();
                    break;
                default:
                    console.error('Unknown ai websocket event', event);
            }
        },
        [onData]
    );

    const close = useCallback(() => {
        aiAssistantSocket.removeListener(commandType, eventHandler);
        aiAssistantSocket.removeListener('error', onError);
        setLoading(false);
        deltaStreamParserRef.current.reset();
    }, [aiAssistantSocket, commandType, eventHandler]);

    const onError = useCallback(
        (error: string) => {
            toast.error(error);
            close();
        },
        [close]
    );

    const emit = useCallback(
        (params) => {
            aiAssistantSocket.addListener('error', onError);
            aiAssistantSocket.addListener(commandType, eventHandler);
            aiAssistantSocket.emit(commandType, params);
            setLoading(true);
        },
        [aiAssistantSocket, commandType]
    );

    return {
        loading,
        emit,
        cancel: close,
    };
}
