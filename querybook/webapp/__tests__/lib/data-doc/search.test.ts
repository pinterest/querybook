import { replaceStringIndices } from 'lib/data-doc/search';

const testString = 'the quick brown fox jumps over the lazy dog';

test('Replace empty case', () => {
    expect(replaceStringIndices(testString, [], 'ze')).toBe(
        'the quick brown fox jumps over the lazy dog'
    );
});

test('Replace simple case', () => {
    expect(replaceStringIndices(testString, [[0, 3]], 'ze')).toBe(
        'ze quick brown fox jumps over the lazy dog'
    );
});

test('Replace multiple case', () => {
    expect(
        replaceStringIndices(
            testString,
            [
                [0, 3],
                [31, 34],
            ],
            'le'
        )
    ).toBe('le quick brown fox jumps over le lazy dog');
    expect(
        replaceStringIndices(
            testString,
            [
                [16, 19],
                [40, 43],
            ],
            'tiger'
        )
    ).toBe('the quick brown tiger jumps over the lazy tiger');
});
