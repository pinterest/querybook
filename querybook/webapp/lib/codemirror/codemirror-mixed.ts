import { parseMixed } from '@lezer/common';

import { StandardSQL, sql } from '@codemirror/lang-sql';
import { LanguageSupport } from '@codemirror/language';
import { liquid } from '@codemirror/lang-liquid';

const liquidBasedSQL = liquid({ base: sql() });

const liquidString = { parser: liquidBasedSQL.language.parser };

const matchingBraces = {
    '{{': '}}',
    '{%': '%}',
};

const mixedSQLLanguage = StandardSQL.language.configure({
    wrap: parseMixed((node, input) => {
        if (node.name === 'String' || node.name === 'QuotedIdentifier') {
            return liquidString;
        }
        if (node.name === 'Braces') {
            // must have at least length 4 to wrap
            if (node.to - node.from < 4) {
                return null;
            }
            const startText = input.read(node.from, node.from + 2);
            const endText = input.read(node.to - 2, node.to);
            const bracesMatch =
                startText in matchingBraces &&
                matchingBraces[startText] === endText;
            if (bracesMatch) {
                return liquidString;
            }
        }

        return null;
    }),
});

export function mixedSQL() {
    return new LanguageSupport(mixedSQLLanguage, []);
}
