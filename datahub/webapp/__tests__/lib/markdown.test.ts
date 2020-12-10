import { sanitizeAndExtraMarkdown } from 'lib/markdown';

describe('sanitizeAndExtraMarkdown', () => {
    it('Works for standard markdown', () => {
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
