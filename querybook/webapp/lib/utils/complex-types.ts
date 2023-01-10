export interface ComplexType {
    key: string;
    type: string;
    children?: ComplexType[];
}

const INDENT = '  ';

/**
 * Convert a complex Hive type string to a nested JSON object
 *
 * Example: 'column', 'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>'
 * Output: {
        key: 'column',
        type: 'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>',
        children: [
            {
                key: 'date',
                type: 'struct<year:int,month:int,day:int>',
                children: [
                    { key: 'year', type: 'int' },
                    { key: 'month', type: 'int' },
                    { key: 'day', type: 'int' },
                ],
            },
            { key: 'hour', type: 'int' },
            { key: 'minute', type: 'int' },
            { key: 'second', type: 'int' },
            { key: 'timeZoneId', type: 'string' },
        ],
    }
 */
export function parseType(key: string, type: string): ComplexType {
    const regex = /^(struct|array|map|uniontype)<(.*)>$/i;
    const matches = type.match(regex);

    if (!matches || matches.length < 3) {
        return { key, type };
    }

    const [_, typeName, typeContents] = matches;

    switch (typeName.toLowerCase()) {
        case 'struct':
            return parseStructType(key, type, typeContents);
        case 'array':
            return parseArrayType(key, type, typeContents);
        case 'map':
            return parseMapType(key, type, typeContents);
        case 'uniontype':
            return parseUnionType(key, type, typeContents);
        default:
            return { key, type };
    }
}

export function parseStructType(
    key: string,
    type: string,
    typeContents: string
): ComplexType {
    const children = [];
    let currentKey = '';
    let currentVal = '';
    let depth = 0;

    for (const char of typeContents) {
        if (char === ':') {
            if (depth > 0) {
                currentVal += char;
            } else {
                currentKey = currentVal;
                currentVal = '';
            }
        } else if (char === ',') {
            if (depth === 0) {
                children.push(parseType(currentKey, currentVal));
                currentKey = '';
                currentVal = '';
            } else {
                currentVal += char;
            }
        } else if (char === '<') {
            depth += 1;
            currentVal += char;
        } else if (char === '>') {
            depth -= 1;
            currentVal += char;
        } else {
            currentVal += char;
        }
    }

    if (depth > 0) {
        // Truncated or malformed type, return as-is
        return { key, type };
    }

    children.push(parseType(currentKey, currentVal));

    const structType: ComplexType = {
        key,
        type,
        children,
    };

    return structType;
}

export function parseMapType(
    key: string,
    type: string,
    typeContents: string
): ComplexType {
    const children: ComplexType[] = [];
    let currentKey = '';
    let currentVal = '';
    let depth = 0;

    for (const char of typeContents) {
        if (char === ',') {
            if (depth > 0) {
                currentVal += char;
            } else {
                currentKey = currentVal;
                currentVal = '';
            }
        } else if (char === '<') {
            depth += 1;
            currentVal += char;
        } else if (char === '>') {
            depth -= 1;
            currentVal += char;
        } else {
            currentVal += char;
        }
    }

    if (depth > 0) {
        // Truncated or malformed type, return as-is
        return { key, type };
    }

    children.push(parseType('<key>', currentKey));
    children.push(parseType('<value>', currentVal));

    const mapType: ComplexType = {
        key,
        type,
        children,
    };

    return mapType;
}

export function parseUnionType(
    key: string,
    type: string,
    typeContents: string
): ComplexType {
    const children: ComplexType[] = [];
    let currentVal = '';
    let depth = 0;

    for (const char of typeContents) {
        if (char === ',') {
            if (depth > 0) {
                currentVal += char;
            } else {
                children.push(parseType('<element>', currentVal));
                currentVal = '';
            }
        } else if (char === '<') {
            depth += 1;
            currentVal += char;
        } else if (char === '>') {
            depth -= 1;
            currentVal += char;
        } else {
            currentVal += char;
        }
    }

    if (depth > 0) {
        // Truncated or malformed type, return as-is
        return { key, type };
    }

    children.push(parseType('<element>', currentVal));

    const unionType: ComplexType = {
        key,
        type,
        children,
    };

    return unionType;
}

export function parseArrayType(
    key: string,
    type: string,
    typeContents: string
): ComplexType {
    const regex = /array<(.*)>/;
    const matches = type.match(regex);

    if (!matches) {
        return { key, type };
    }

    return {
        key,
        type,
        children: [parseType('<element>', typeContents)],
    };
}

/**
 * Pretty-print a complex Hive type string using newlines and 2-space indentation.
 */
export function prettyPrintType(type: string): string {
    let prettyString = '';
    let depth = 0;

    for (const char of type) {
        if (char === '<') {
            prettyString += '<\n';
            depth += 1;
            prettyString += INDENT.repeat(depth);
        } else if (char === '>') {
            prettyString += '\n';
            depth -= 1;
            prettyString += INDENT.repeat(depth);
            prettyString += '>';
        } else if (char === ',') {
            prettyString += ',\n';
            prettyString += INDENT.repeat(depth);
        } else if (char === ':') {
            prettyString += ': ';
        } else {
            prettyString += char;
        }
    }

    return prettyString;
}
