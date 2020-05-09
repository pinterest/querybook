import moment from 'moment';
import Mustache from 'mustache';

import ds from 'lib/datasource';

// We remove escape since we don't need HTML escape for querying
Mustache.escape = (text) => text;
const GLOBAL_FUNCTIONS = ['latest_partition', 'date_add'];
const GLOBAL_STRINGS = ['today', 'yesterday'];
const GLOBAL_VARIABLES = GLOBAL_FUNCTIONS.concat(GLOBAL_STRINGS);

type MustacheRenderFunction = (
    text: string,
    render: (s: string) => string
) => string;

interface IMustacheToken extends Array<any> {
    0: string; // Type
    1: string; // Tag name
    2: number; // Tag start
    3: number; // Tag end
    4?: IMustacheToken[]; // Inner Tokens
    5?: number; // Inner Tag end
}

function tokensToVariableNames(
    tokens: IMustacheToken[],
    includeGlobal: boolean
): Set<string> {
    let variables = new Set<string>();

    for (const token of tokens) {
        const [tagType, tagName] = token;
        if (tagType === 'name' || tagType === '>') {
            // name is simple variable, > is recursive partial
            if (
                (includeGlobal || !GLOBAL_STRINGS.includes(tagName)) &&
                tagName !== '.' // "." is "this" in mustache
            ) {
                variables.add(tagName);
            }
        } else if (tagType === '#' || tagType === '^') {
            // # is Selection and ^ is inverted selection
            // They are used as functions in this case
            if (includeGlobal || !GLOBAL_VARIABLES.includes(tagName)) {
                variables.add(tagName);
            }

            const isFunctionCall = GLOBAL_FUNCTIONS.includes(tagName);
            const innerTokens = token[4];
            if (isFunctionCall && innerTokens) {
                variables = new Set([
                    ...variables,
                    ...tokensToVariableNames(innerTokens, includeGlobal),
                ]);
            }
        }
    }

    return variables;
}

export function getTemplatedQueryVariables(
    context: string,
    includeGlobal = false
) {
    return [...tokensToVariableNames(Mustache.parse(context), includeGlobal)];
}

export async function renderTemplatedQuery(
    query: string,
    variables: Record<string, string>
) {
    const { data } = await ds.save('/query_execution/templated_query/', {
        query,
        variables,
    });
    return data;
}
