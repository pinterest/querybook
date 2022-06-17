import {
    deserializeCopyCommand,
    serializeCopyCommand,
} from 'lib/data-doc/copy';

test('Simple serialize case', () => {
    expect(
        serializeCopyCommand({
            cellId: 12345,
            cut: false,
        })
    ).toBe('__QUERYBOOK__DATADOC__{"cellId":12345,"cut":false}');
});

test('Simple deserialize cases', () => {
    expect(
        deserializeCopyCommand(
            '__QUERYBOOK__DATADOC__{"cellId":54321,"cut":true}'
        )
    ).toStrictEqual({
        cellId: 54321,
        cut: true,
    });

    // Invalid prefix
    expect(
        deserializeCopyCommand(
            '__QUERYBOOK__DATADOC{"cellId":54321,"cut":true}'
        )
    ).toBe(null);

    // Invalid json
    expect(
        deserializeCopyCommand(
            '__QUERYBOOK__DATADOC__{"cellId":54321,"cut:true}'
        )
    ).toBe(null);
});
