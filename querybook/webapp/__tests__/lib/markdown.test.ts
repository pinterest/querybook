import { sanitizeAndExtraMarkdown } from 'lib/markdown';

describe('sanitizeAndExtraMarkdown', () => {
    it('Works for standard markdown', () => {
        expect(sanitizeAndExtraMarkdown('')).toEqual(['', {}]);
        expect(sanitizeAndExtraMarkdown('\n\n\n')).toEqual(['\n\n\n', {}]);

        const markdown = 'Hello **World** ---\nHello There.';
        expect(sanitizeAndExtraMarkdown(markdown)).toEqual([markdown, {}]);
    });

    it('Extract Properties for --- markdown', () => {
        const markdown = `---
foo: bar
bar: baz
---
Hello **World**`;
        expect(sanitizeAndExtraMarkdown(markdown)).toEqual([
            'Hello **World**',
            { foo: 'bar', bar: 'baz' },
        ]);
    });

    it('Extract Properties for multiple ---', () => {
        const markdown = `test
---
foo: bar
---
test2
---
bar: baz
---
Hello **World**`;
        expect(sanitizeAndExtraMarkdown(markdown)).toEqual([
            'test\ntest2\nHello **World**',
            { foo: 'bar', bar: 'baz' },
        ]);
    });

    it('Only extracts valid properties', () => {
        const markdown = `---
foobar
bar: baz
---
Hello **World**`;
        expect(sanitizeAndExtraMarkdown(markdown)).toEqual([
            'Hello **World**',
            { bar: 'baz' },
        ]);
    });
});
