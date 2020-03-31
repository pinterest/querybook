import moment from 'moment';
import Mustache from 'mustache';

// We remove escape since we don't need HTML escape for querying
Mustache.escape = (text) => text;
const FUNCTION_NAMES = ['latest_partition', 'date_add'];
const GLOBAL_VARIABLES = ['today', 'yesterday'];
const ALL_VARIABLES = FUNCTION_NAMES.concat(GLOBAL_VARIABLES);

interface IMustacheToken extends Array<any> {
    0: string; // Type
    1: string; // Tag name
    2: number; // Tag start
    3: number; // Tag end
    4?: IMustacheToken[]; // Inner Tokens
    5?: number; // Inner Tag end
}

function tokensToVariableNames(tokens: IMustacheToken[]): Set<string> {
    let variables = new Set<string>();

    for (const token of tokens) {
        const [tagType, tagName] = token;
        if (tagType === 'name') {
            // "." is "this" in mustache
            if (!GLOBAL_VARIABLES.includes(tagName) && tagName !== '.') {
                variables.add(tagName);
            }
        } else if (tagType === '#' || tagType === '^') {
            if (!ALL_VARIABLES.includes(tagName)) {
                variables.add(tagName);
            }

            const isFunctionCall = FUNCTION_NAMES.includes(tagName);
            const innerTokens = token[4];
            if (isFunctionCall && innerTokens) {
                variables = new Set([
                    ...variables,
                    ...tokensToVariableNames(innerTokens),
                ]);
            }
        }
    }

    return variables;
}

export function getTemplatedQueryVariables(context: string) {
    return [...tokensToVariableNames(Mustache.parse(context))];
}

let defaultVariables = null;
function getDefaultVariables() {
    if (!defaultVariables) {
        defaultVariables = {
            latest_partition: () => {
                return (text: string, render: (s: string) => string) => {
                    const tableName = render(text);
                    // get table partition info somehow
                    // TODO: implement a real version
                    return `dt="${moment()
                        .subtract(1, 'days')
                        .format('YYYY-MM-DD')}"`;
                };
            },

            date_add: () => {
                return (text: string, render: (s: string) => string) => {
                    const input = render(text);
                    const [dateValue, dateDiff] = input.split(',');

                    return moment(dateValue.trim())
                        .add(Number(dateDiff), 'days')
                        .format('YYYY-MM-DD');
                };
            },
        };
    }

    return {
        ...defaultVariables,
        today: moment().format('YYYY-MM-DD'),
        yesterday: moment().subtract(1, 'days').format('YYYY-MM-DD'),
    };
}

export async function renderTemplatedQuery(
    query: string,
    variables: Record<string, string>
) {
    const allVariables = {
        ...getDefaultVariables(),
        ...Object.entries(variables).reduce((hash, [name, val]) => {
            if (val) {
                hash[name] = val;
            }
            return hash;
        }, {}),
    };

    return Mustache.render(query, allVariables);
}
