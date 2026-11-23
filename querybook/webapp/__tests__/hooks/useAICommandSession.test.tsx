import { EventEmitter } from 'events';
import React from 'react';
import toast from 'react-hot-toast';
import { act, create } from 'react-test-renderer';

import { AICommandType, AISocketEvent } from 'const/aiAssistant';
import { ElementType } from 'const/analytics';
import {
    footerActions,
    parseTextToSqlResult,
    readyToastText,
    useAICommandSession,
} from 'hooks/useAICommandSession';
import { trackClick } from 'lib/analytics';

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
    default: {
        error: jest.fn(),
        success: jest.fn(() => 'ready-toast'),
        dismiss: jest.fn(),
    },
}));

jest.mock('lib/analytics', () => ({ trackClick: jest.fn() }));

const command = AICommandType.TEXT_TO_SQL;

type Session = ReturnType<typeof useAICommandSession>;

function renderSession() {
    const onTablesSuggested = jest.fn();
    const onAccept = jest.fn();
    const session: { current: Session } = { current: null };
    const Harness = () => {
        session.current = useAICommandSession({
            queryEngineId: 1,
            onTablesSuggested,
            onAccept,
        });
        return null;
    };

    let renderer;
    act(() => {
        renderer = create(<Harness />);
    });

    return {
        session,
        onTablesSuggested,
        onAccept,
        unmount: () => act(() => renderer.unmount()),
    };
}

function lastPayload() {
    return mockEmit.mock.calls[mockEmit.mock.calls.length - 1][1];
}

function serverSends(event: AISocketEvent, payload?) {
    act(() => {
        mockSocket.emit(command, event, payload, lastPayload().request_id);
    });
}

function finishWith(payload, event = AISocketEvent.DATA) {
    serverSends(event, payload);
    serverSends(AISocketEvent.CLOSE);
}

const GENERATE = {
    kind: 'generate' as const,
    question: 'daily users',
    originalQuery: '',
    tables: ['db.users'],
};

function generateThenView(session: { current: Session }, query = 'SELECT 1') {
    act(() => session.current.submit(GENERATE));
    finishWith({ query, explanation: '' });
    act(() => session.current.view());
}

beforeEach(() => {
    mockSocket.removeAllListeners();
    mockEmit.mockClear();
    (toast.error as jest.Mock).mockClear();
    (toast.success as jest.Mock).mockClear();
    (toast.dismiss as jest.Mock).mockClear();
    (trackClick as jest.Mock).mockClear();
});

describe('useAICommandSession', () => {
    it('submits a generate request without revision fields', () => {
        const { session } = renderSession();

        act(() => session.current.submit(GENERATE));

        const payload = lastPayload();
        expect(payload).toMatchObject({
            query_engine_id: 1,
            tables: ['db.users'],
            question: 'daily users',
            original_query: '',
        });
        expect(payload).not.toHaveProperty('proposed_query');
        expect(payload).not.toHaveProperty('requested_changes');
        expect(session.current.isRunning).toBe(true);
        expect(session.current.modalOpen).toBe(false);
    });

    it('runs in the background and shows the ready toast when done', () => {
        const { session } = renderSession();

        act(() => session.current.submit(GENERATE));
        finishWith({ query: 'SELECT 1' });

        expect(toast.success).toHaveBeenCalledTimes(1);
        expect(session.current.hasUnviewedResult).toBe(true);
        expect(session.current.result).toMatchObject({ query: 'SELECT 1' });

        act(() => session.current.view());
        expect(session.current.modalOpen).toBe(true);
        expect(session.current.hasUnviewedResult).toBe(false);
        expect(toast.dismiss).toHaveBeenCalledWith('ready-toast');
    });

    it('sends a revision with the original question and query', () => {
        const { session } = renderSession();
        act(() =>
            session.current.submit({
                ...GENERATE,
                kind: 'edit',
                originalQuery: 'SELECT *',
            })
        );
        finishWith({ query: 'SELECT 1' });
        act(() => session.current.view());

        act(() => session.current.requestChanges('group by day', ['db.users']));

        expect(lastPayload()).toMatchObject({
            question: 'daily users',
            original_query: 'SELECT *',
            proposed_query: 'SELECT 1',
            requested_changes: 'group by day',
        });
        expect(session.current.modalOpen).toBe(false);
        expect(session.current.hasUnviewedResult).toBe(false);
        expect(trackClick).toHaveBeenLastCalledWith(
            expect.objectContaining({
                element: ElementType.QUERY_GENERATION_BUTTON,
                aux: expect.objectContaining({ mode: 'revise' }),
            })
        );
    });

    it('keeps the previous query when a revision is stopped', () => {
        const { session } = renderSession();
        generateThenView(session);

        act(() => session.current.requestChanges('group by day', []));
        serverSends(AISocketEvent.DATA, { query: 'SELECT 2' });
        act(() => session.current.cancel());

        expect(session.current.isRunning).toBe(false);
        expect(session.current.result).toMatchObject({ query: 'SELECT 1' });
        expect(session.current.hasUnviewedResult).toBe(true);
        expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('keeps the previous query when a revision fails', () => {
        const { session } = renderSession();
        generateThenView(session);

        act(() => session.current.requestChanges('group by day', []));
        serverSends(AISocketEvent.ERROR, 'LLM timeout');

        expect(session.current.result).toMatchObject({ query: 'SELECT 1' });
        expect(session.current.hasUnviewedResult).toBe(true);
    });

    it('leaves nothing to view when a first request fails', () => {
        const { session } = renderSession();

        act(() => session.current.submit(GENERATE));
        serverSends(AISocketEvent.ERROR, 'LLM timeout');

        expect(session.current.hasUnviewedResult).toBe(false);
        expect(session.current.result).toBeNull();
    });

    it('treats a revision with only an explanation as a failure', () => {
        const { session } = renderSession();
        generateThenView(session);

        act(() => session.current.requestChanges('group by day', []));
        finishWith({ query: '', explanation: "Sorry, I can't do that" });

        expect(toast.error).toHaveBeenCalledWith("Sorry, I can't do that");
        expect(session.current.result).toMatchObject({ query: 'SELECT 1' });
    });

    it('replaces the previous query when a revision asks for tables', () => {
        const { session, onTablesSuggested } = renderSession();
        generateThenView(session);

        act(() => session.current.requestChanges('use orders too', []));
        finishWith(['db.orders'], AISocketEvent.TABLES);

        expect(onTablesSuggested).toHaveBeenCalledWith(['db.orders']);
        expect(session.current.result).toEqual({
            kind: 'tables',
            tables: ['db.orders'],
        });
    });

    it('continues the same request in the open modal', () => {
        const { session } = renderSession();
        act(() => session.current.submit({ ...GENERATE, tables: [] }));
        finishWith(['db.users'], AISocketEvent.TABLES);
        act(() => session.current.view());

        act(() => session.current.continueRequest(['db.users']));

        expect(session.current.modalOpen).toBe(true);
        expect(session.current.isStreaming).toBe(true);
        expect(session.current.request.kind).toBe('generate');
        expect(lastPayload().tables).toEqual(['db.users']);
        // The previous tables result isn't shown while the new one streams.
        expect(session.current.result).toBeNull();
    });

    it('keeps the last non-empty query while streaming', () => {
        const { session } = renderSession();
        generateThenView(session);
        act(() => session.current.continueRequest(['db.users']));

        serverSends(AISocketEvent.DATA, { query: 'SELECT a' });
        serverSends(AISocketEvent.DATA, { query: '' });

        expect(session.current.result).toMatchObject({ query: 'SELECT a' });
    });

    it('accepts and rejects by clearing the result', () => {
        const { session, onAccept } = renderSession();
        generateThenView(session);

        act(() => session.current.accept());
        expect(onAccept).toHaveBeenCalledWith('SELECT 1');
        expect(session.current.result).toBeNull();
        expect(session.current.modalOpen).toBe(false);

        generateThenView(session);
        act(() => session.current.reject());
        expect(session.current.result).toBeNull();
        expect(session.current.hasUnviewedResult).toBe(false);
        expect(trackClick).toHaveBeenLastCalledWith(
            expect.objectContaining({
                element: ElementType.QUERY_GENERATION_REJECT_BUTTON,
                aux: expect.objectContaining({ mode: 'generate' }),
            })
        );
    });

    it('dismisses the modal but keeps the result', () => {
        const { session } = renderSession();
        generateThenView(session);

        act(() => session.current.dismiss());

        expect(session.current.modalOpen).toBe(false);
        expect(session.current.hasUnviewedResult).toBe(true);
    });

    it('dismisses the ready toast on submit and unmount', () => {
        const { session, unmount } = renderSession();
        act(() => session.current.submit(GENERATE));
        finishWith({ query: 'SELECT 1' });

        act(() => session.current.submit(GENERATE));
        expect(toast.dismiss).toHaveBeenCalledWith('ready-toast');
        finishWith({ query: 'SELECT 2' });

        (toast.dismiss as jest.Mock).mockClear();
        unmount();
        expect(toast.dismiss).toHaveBeenCalledWith('ready-toast');
    });
});

describe('parseTextToSqlResult', () => {
    it('parses tables and query results', () => {
        expect(parseTextToSqlResult({ type: 'tables', data: ['a'] })).toEqual({
            kind: 'tables',
            tables: ['a'],
        });
        expect(
            parseTextToSqlResult({
                type: 'data',
                data: { query: 'SELECT 1', explanation: 'why' },
            })
        ).toEqual({ kind: 'query', query: 'SELECT 1', explanation: 'why' });
    });

    it('falls back to data.data for the explanation', () => {
        expect(
            parseTextToSqlResult({ type: 'data', data: { data: 'note' } })
        ).toEqual({ kind: 'query', query: '', explanation: 'note' });
    });

    it('returns null for an empty result', () => {
        expect(parseTextToSqlResult(undefined)).toBeNull();
    });
});

describe('footerActions', () => {
    const query = { kind: 'query' as const, query: 'SELECT 1' };

    it('shows only Generating while streaming', () => {
        expect(footerActions(query, true)).toEqual({
            generating: true,
            requestChanges: false,
            accept: false,
            reject: false,
            dismiss: false,
        });
    });

    it('shows everything for a finished query', () => {
        expect(footerActions(query, false)).toEqual({
            generating: false,
            requestChanges: true,
            accept: true,
            reject: true,
            dismiss: true,
        });
    });

    it.each([
        ['a table picker', { kind: 'tables' as const, tables: ['a'] }],
        [
            'an explanation only',
            { kind: 'query' as const, query: '', explanation: 'no' },
        ],
    ])('shows only Reject and Dismiss for %s', (_, result) => {
        expect(footerActions(result, false)).toEqual({
            generating: false,
            requestChanges: false,
            accept: false,
            reject: true,
            dismiss: true,
        });
    });
});

describe('readyToastText', () => {
    const request = { ...GENERATE };

    it('describes query and table-picker results', () => {
        expect(
            readyToastText(request, { kind: 'query', query: 'SELECT 1' })
        ).toBe('AI response ready for "daily users"');
        expect(readyToastText(request, { kind: 'tables', tables: [] })).toBe(
            'AI needs you to pick tables for "daily users"'
        );
    });

    it('quotes the requested change for revisions', () => {
        expect(
            readyToastText(
                {
                    ...request,
                    kind: 'revise',
                    requestedChanges: 'group by day',
                },
                { kind: 'query', query: 'SELECT 1' }
            )
        ).toBe('AI response ready for "group by day"');
    });
});
