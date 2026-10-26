import { EventEmitter } from 'events';
import React from 'react';
import toast from 'react-hot-toast';
import { act, create } from 'react-test-renderer';

import { AICommandType, AISocketEvent } from 'const/aiAssistant';
import { AISocket, useAISocket } from 'hooks/useAISocket';

const mockSocket = new EventEmitter();
const mockEmit = jest.fn();

jest.mock('lib/ai-assistant/ai-assistant-socketio', () => ({
    __esModule: true,
    default: {
        emit: (...args) => mockEmit(...args),
        addListener: (event, listener) => mockSocket.on(event, listener),
        removeListener: (event, listener) => mockSocket.off(event, listener),
    },
}));

jest.mock('react-hot-toast', () => ({
    __esModule: true,
    default: { error: jest.fn() },
}));

const command = AICommandType.TEXT_TO_SQL;

function renderHook(onData: jest.Mock) {
    const result: { current: AISocket } = { current: null };
    const Harness = ({ onData }) => {
        result.current = useAISocket(command, (data) => onData(data));
        return null;
    };

    let renderer;
    act(() => {
        renderer = create(<Harness onData={onData} />);
    });

    return {
        result,
        rerender: (onData: jest.Mock) =>
            act(() => renderer.update(<Harness onData={onData} />)),
    };
}

function lastRequestId() {
    return mockEmit.mock.calls[mockEmit.mock.calls.length - 1][1].request_id;
}

function serverSends(event: AISocketEvent, payload, requestId: string) {
    act(() => {
        mockSocket.emit(command, event, payload, requestId);
    });
}

beforeEach(() => {
    mockSocket.removeAllListeners();
    mockEmit.mockClear();
    (toast.error as jest.Mock).mockClear();
});

it('ignores events from a superseded request', () => {
    const onData = jest.fn();
    const { result } = renderHook(onData);

    act(() => result.current.emit({ question: 'first' }));
    const staleRequestId = lastRequestId();
    act(() => result.current.emit({ question: 'second' }));

    serverSends(AISocketEvent.DATA, { query: 'stale' }, staleRequestId);
    expect(onData).not.toHaveBeenCalled();

    serverSends(AISocketEvent.DATA, { query: 'fresh' }, lastRequestId());
    expect(onData).toHaveBeenCalledWith({
        type: 'data',
        data: { query: 'fresh' },
    });
});

it('handles each event once when emitting over an in-flight request', () => {
    const { result } = renderHook(jest.fn());

    act(() => result.current.emit({ question: 'first' }));
    act(() => result.current.emit({ question: 'second' }));

    serverSends(AISocketEvent.ERROR, 'LLM timeout', lastRequestId());

    expect(toast.error).toHaveBeenCalledTimes(1);
    expect(result.current.failed).toBe(true);
    expect(result.current.loading).toBe(false);
});

it('removes its listeners on close after re-rendering with a new onData', () => {
    const { result, rerender } = renderHook(jest.fn());

    act(() => result.current.emit({ question: 'first' }));
    const latestOnData = jest.fn();
    rerender(latestOnData);

    serverSends(AISocketEvent.DATA, { query: 'q' }, lastRequestId());
    expect(latestOnData).toHaveBeenCalledTimes(1);

    serverSends(AISocketEvent.CLOSE, null, lastRequestId());
    expect(mockSocket.listenerCount(command)).toBe(0);
    expect(mockSocket.listenerCount('error')).toBe(0);
});
