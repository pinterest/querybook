import { isQueryUsingTemplating } from 'lib/templated-query/validation';

test('basic sql no templating', () => {
    expect(isQueryUsingTemplating('select 2; select 3')).toBe(false);
});

test('sql with variable templating', () => {
    expect(isQueryUsingTemplating('select 2; {{ foo }} select 3')).toBe(true);
});

test('sql with loop templating', () => {
    expect(
        isQueryUsingTemplating(
            'select 2; {% for user in users %} select 3 {% endfor %}'
        )
    ).toBe(true);
});

test('sql with broken templating', () => {
    expect(isQueryUsingTemplating('select 2; {{  select 3  ')).toBe(true);
});
