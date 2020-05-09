import { getTemplatedQueryVariables } from 'lib/templated-query';

test('Basic find variable in string', () => {
    expect(
        getTemplatedQueryVariables('{{ test }} {{ another_test }}')
    ).toStrictEqual(['test', 'another_test']);
    expect(
        getTemplatedQueryVariables('{{ test }} {{ another_test }} {{ today }}')
    ).toStrictEqual(['test', 'another_test']);
    expect(
        getTemplatedQueryVariables(
            '{{ test }} {{ another_test }} {{ today }}',
            true
        )
    ).toStrictEqual(['test', 'another_test', 'today']);
});
