import {
    serializeCopyCommand,
    deserializeCopyCommand,
} from 'lib/data-doc/copy';

test('Simple serialize case', () => {
    expect(
        serializeCopyCommand({
            cellId: 12345,
            cut: false,
        })
    ).toBe('__DATAHUB__DATADOC__{"cellId":12345,"cut":false}');
});

test('Simple deserialize cases', () => {
    expect(
        deserializeCopyCommand(
            '__DATAHUB__DATADOC__{"cellId":54321,"cut":true}'
        )
    ).toStrictEqual({
        cellId: 54321,
        cut: true,
    });

    // Invalid prefix
    expect(
        deserializeCopyCommand('__DATAHUB__DATADOC{"cellId":54321,"cut":true}')
    ).toBe(null);

    // Invalid json
    expect(
        deserializeCopyCommand('__DATAHUB__DATADOC__{"cellId":54321,"cut:true}')
    ).toBe(null);
});
