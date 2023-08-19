import { useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import { AICommandType } from 'const/aiAssistant';
import aiAssistantSocket from 'lib/ai-assistant/ai-assistant-socketio';
import { DeltaStreamParser } from 'lib/stream';

export function useAISocket(
    commandType: AICommandType,
    onData: (data: { type?: string; data: { [key: string]: string } }) => void
): {
    loading: boolean;
    emit: (payload: object) => void;
    cancel: () => void;
} {
    const [loading, setLoading] = useState(false);

    const deltaStreamParserRef = useRef<DeltaStreamParser>(
        new DeltaStreamParser()
    );

    const eventHandler = useCallback((event, payload) => {
        const parser = deltaStreamParserRef.current;
        switch (event) {
            case 'data':
                onData({ data: { data: payload } });
                break;

            case 'delta_data':
                parser.parse(payload);
                onData({ data: parser.result });
                break;

            case 'delta_end':
                parser.close();
                onData({ data: parser.result });
                break;

            case 'tables':
                onData({ type: 'tables', data: payload });
                break;

            case 'close':
                close();
                break;

            case 'error':
                toast.error(payload);
                close();
                break;
            default:
                console.error('Unknown ai websocket event', event);
        }
    }, []);

    const close = useCallback(() => {
        aiAssistantSocket.removeListener(commandType, eventHandler);
        setLoading(false);
        deltaStreamParserRef.current.reset();
    }, []);

    const emit = useCallback(
        (params) => {
            aiAssistantSocket.addListener(commandType, eventHandler);
            aiAssistantSocket.emit(commandType, params);
            setLoading(true);
        },
        [commandType]
    );

    return {
        loading,
        emit,
        cancel: close,
    };
}
