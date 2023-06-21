import { DeltaStreamParser } from 'lib/stream';

describe('DeltaStreamParser', () => {
    it('Works for stream without key/value pairs', () => {
        const parser = new DeltaStreamParser();
        expect(parser.parse('some data')).toEqual({
            data: 'some data',
        });
        expect(parser.parse('\nsome more data')).toEqual({
            data: 'some data\nsome more data',
        });
    });

    it('Works for stream with both data and key/value pairs', () => {
        const parser = new DeltaStreamParser();
        parser.parse('some data');
        expect(parser.parse('\n<@some_key@>\nsome value')).toEqual({
            data: 'some data\n',
            some_key: 'some value',
        });
    });

    it('Works for stream with only key/value pairs', () => {
        const parser = new DeltaStreamParser();
        expect(parser.parse('<@some_key@>')).toEqual({
            data: '',
            some_key: '',
        });
        expect(parser.parse('\nsome value\n')).toEqual({
            data: '',
            some_key: 'some value\n',
        });
        expect(parser.parse('<@another_key@>\nanother value')).toEqual({
            data: '',
            some_key: 'some value\n',
            another_key: 'another value',
        });
    });

    it('Works for partial stream', () => {
        const parser = new DeltaStreamParser();
        expect(parser.parse('some da')).toEqual({
            data: 'some da',
        });
        // wait for <@ to be complete before parsing
        expect(parser.parse('ta<')).toEqual({
            data: 'some da',
        });
        // the next char is not @, so it will be treated as data
        expect(parser.parse('ta')).toEqual({
            data: 'some data<ta',
        });

        // wait for <@ to be complete before parsing
        expect(parser.parse('<')).toEqual({
            data: 'some data<ta',
        });
        // the next char is @, so the following will be treated as key
        expect(parser.parse('@som')).toEqual({
            data: 'some data<ta',
        });
        // wait for @> to be complete before parsing
        expect(parser.parse('e_key@')).toEqual({
            data: 'some data<ta',
        });
        expect(parser.parse('>\n')).toEqual({
            data: 'some data<ta',
            some_key: '',
        });
        expect(parser.parse('som')).toEqual({
            data: 'some data<ta',
            some_key: 'som',
        });
        expect(parser.parse('e value')).toEqual({
            data: 'some data<ta',
            some_key: 'some value',
        });
        // ignore the last incomplete key
        expect(parser.parse('<@ano')).toEqual({
            data: 'some data<ta',
            some_key: 'some value',
        });
    });
});
