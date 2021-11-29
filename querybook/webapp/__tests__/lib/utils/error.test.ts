import { formatError } from 'lib/utils/error';

test('format error object', () => {
    const testErrorObj = new Error();
    testErrorObj['isAxiosError'] = true;
    testErrorObj['response'] = { data: { error: 'test error message' } };

    expect(formatError(testErrorObj)).toBe('test error message');
});

test('format error string', () => {
    expect(formatError('test error message')).toBe('test error message');
});
