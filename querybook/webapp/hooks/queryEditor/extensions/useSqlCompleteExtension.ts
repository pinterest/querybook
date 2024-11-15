import { inlineCopilot } from 'codemirror-copilot';
import { useMemo } from 'react';

import { AICommandType, AISocketEvent } from 'const/aiAssistant';
import aiAssistantSocket from 'lib/ai-assistant/ai-assistant-socketio';

/**
 * A hacky workaround to remove overlapping part with prefix from completion.
 *
 * e.g. removeOverlapPrefix('sel', 'elect *') => 'ect *'
 */
const removeOverlapPrefix = (completion: string, prefix: string) => {
    let commonPrefixLength = 0;
    for (let i = 0; i < prefix.length; i++) {
        if (completion.startsWith(prefix.slice(i))) {
            commonPrefixLength = prefix.length - i;
            break;
        }
    }
    if (commonPrefixLength > 0) {
        completion = completion.slice(commonPrefixLength);
    }
    return completion;
};

const getCodeCompletionFromWebSocket = async (requestPayload: {
    query_engine_id: number;
    tables: string[];
    prefix: string;
    suffix: string;
}): Promise<string> => {
    return new Promise((resolve) => {
        const eventHandler = (event, payload) => {
            switch (event) {
                case AISocketEvent.DATA:
                    const completion = removeOverlapPrefix(
                        payload.completion,
                        requestPayload.prefix
                    );
                    resolve(completion);
                    return;

                case AISocketEvent.CLOSE:
                case AISocketEvent.ERROR:
                    aiAssistantSocket.removeListener(
                        AICommandType.SQL_COMPLETE,
                        eventHandler
                    );
                    break;
                default:
                    console.error('Unknown ai websocket event', event);
            }

            resolve('');
        };

        aiAssistantSocket.addListener(AICommandType.SQL_COMPLETE, eventHandler);
        aiAssistantSocket.emit(AICommandType.SQL_COMPLETE, requestPayload);
    });
};

export const useSqlCompleteExtension = ({
    engineId,
    tables = null,
    enabled = false,
}: {
    engineId: number;
    tables?: Set<string>;
    enabled?: boolean;
}) => {
    const extension = useMemo(() => {
        if (!enabled) {
            return [];
        }

        return inlineCopilot(
            (prefix, suffix) =>
                getCodeCompletionFromWebSocket({
                    query_engine_id: engineId,
                    tables: Array.from(tables ?? []),
                    prefix,
                    suffix,
                }),
            1000
        );
    }, [enabled, tables]);

    return extension;
};
