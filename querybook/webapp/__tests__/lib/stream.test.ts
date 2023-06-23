import { DeltaStreamParser } from 'lib/stream';

describe('DeltaStreamParser', () => {
    it('Works for stream without key/value pairs', () => {
        const parser = new DeltaStreamParser();
        parser.parse('some data');
        expect(parser.result).toEqual({
            data: 'some data',
        });
        parser.parse('\nsome more data');
        expect(parser.result).toEqual({
            data: 'some data\nsome more data',
        });
    });

    it('Works for stream ending with non empty buffer', () => {
        const parser = new DeltaStreamParser();
        parser.parse('201');
        parser.parse('9');
        expect(parser.result).toEqual({
            data: '201',
        });
        parser.close();
        expect(parser.result).toEqual({
            data: '2019',
        });
    });

    it('Works for stream with both data and key/value pairs', () => {
        const parser = new DeltaStreamParser();
        parser.parse('some data');
        parser.parse('\n<@some_key@>\nsome value');
        expect(parser.result).toEqual({
            data: 'some data\n',
            some_key: 'some value',
        });
    });

    it('Works for stream with only key/value pairs', () => {
        const parser = new DeltaStreamParser();

        parser.parse('<@some_key@>');
        expect(parser.result).toEqual({
            data: '',
            some_key: '',
        });

        parser.parse('\nsome value\n');
        expect(parser.result).toEqual({
            data: '',
            some_key: 'some value\n',
        });

        parser.parse('<@another_key@>\nanother value');
        expect(parser.result).toEqual({
            data: '',
            some_key: 'some value\n',
            another_key: 'another value',
        });
    });

    it('Works for partial stream', () => {
        const parser = new DeltaStreamParser();
        parser.parse('some da');
        expect(parser.result).toEqual({
            data: 'some da',
        });
        // wait for <@ to be complete before parsing
        parser.parse('ta<');
        expect(parser.result).toEqual({
            data: 'some da',
        });
        // the next char is not @, so it will be treated as data
        parser.parse('ta');
        expect(parser.result).toEqual({
            data: 'some data<ta',
        });

        // wait for <@ to be complete before parsing
        parser.parse('<');
        expect(parser.result).toEqual({
            data: 'some data<ta',
        });
        // the next char is @, so the following will be treated as key
        parser.parse('@som');
        expect(parser.result).toEqual({
            data: 'some data<ta',
        });
        // wait for @> to be complete before parsing
        parser.parse('e_key@');
        expect(parser.result).toEqual({
            data: 'some data<ta',
        });
        parser.parse('>\n');
        expect(parser.result).toEqual({
            data: 'some data<ta',
            some_key: '',
        });
        parser.parse('som');
        expect(parser.result).toEqual({
            data: 'some data<ta',
            some_key: 'som',
        });
        parser.parse('e value');
        expect(parser.result).toEqual({
            data: 'some data<ta',
            some_key: 'some value',
        });
        // ignore the last incomplete key
        parser.parse('<@ano');
        expect(parser.result).toEqual({
            data: 'some data<ta',
            some_key: 'some value',
        });
    });
});
