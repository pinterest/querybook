import { parseMixed } from '@lezer/common';

import { sql } from '@codemirror/lang-sql';
import { LanguageSupport } from '@codemirror/language';
import { liquid } from '@codemirror/lang-liquid';
import { styleTags, tags as t } from '@lezer/highlight';
import { getCodeMirrorSQLDialect } from './codemirror-language';

const liquidBasedSQL = liquid({ base: sql() });

const liquidString = { parser: liquidBasedSQL.language.parser };

const matchingBraces = {
    '{{': '}}',
    '{%': '%}',
};

export function mixedSQL(language: string) {
    const baseSQLLanguage = getCodeMirrorSQLDialect(language);
    const mixedSQLLanguage = baseSQLLanguage.language.configure({
        props: [
            styleTags({
                'CompositeIdentifier/Identifier': t.special(t.propertyName),
            }),
        ],
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
    return new LanguageSupport(mixedSQLLanguage, []);
}
