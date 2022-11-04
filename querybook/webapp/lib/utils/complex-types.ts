/**
 * Convert a complex Hive type string to a nested JSON object
 *
 * Example: 'struct<date:struct<year:int,month:int,day:int>,hour:int,minute:int,second:int,timeZoneId:string>'
 * Output: {
        date: {
            year: 'int',
            month: 'int',
            day: 'int',
        },
        hour: 'int',
        minute: 'int',
        second: 'int',
        timeZoneId: 'string',
    }
 */
export function parseType(type: string): any | string {
    if (type.startsWith('struct<')) {
        return parseStructType(type);
    } else if (type.startsWith('array<')) {
        return parseArrayType(type);
    } else if (type.startsWith('map<')) {
        return parseMapType(type);
    } else if (type.startsWith('uniontype<')) {
        return parseUnionType(type);
    } else {
        return type;
    }
}

export function parseStructType(type: string): Record<string, any> | string {
    const structRegex = /struct<(.*)>/;
    const structMatch = type.match(structRegex);
    if (!structMatch) {
        return type;
    }

    const structStr = structMatch[1];
    const structObj: Record<string, any> = {};
    let currentKey = '';
    let currentVal = '';
    let depth = 0;

    for (const char of structStr) {
        if (char === ':') {
            if (depth > 0) {
                currentVal += char;
            } else {
                currentKey = currentVal;
                currentVal = '';
            }
        } else if (char === ',') {
            if (depth === 0) {
                structObj[currentKey] = parseType(currentVal);
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

    structObj[currentKey] = parseType(currentVal);
    return structObj;
}

export function parseMapType(type: string): Record<string, any> | string {
    const mapRegex = /map<(.*)>/;
    const mapMatch = type.match(mapRegex);
    if (!mapMatch) {
        return type;
    }

    const mapStr = mapMatch[1];
    const mapObj: Record<string, any> = {};
    let currentKey = '';
    let currentVal = '';
    let depth = 0;

    for (const char of mapStr) {
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

    mapObj.key = parseType(currentKey);
    mapObj.value = parseType(currentVal);
    return mapObj;
}

export function parseUnionType(type: string): Record<string, any> | string {
    const unionRegex = /uniontype<(.*)>/;
    const unionMatch = type.match(unionRegex);
    if (!unionMatch) {
        return type;
    }

    const unionStr = unionMatch[1];
    const unionList: string[] = [];
    let currentVal = '';
    let depth = 0;

    for (const char of unionStr) {
        if (char === ',') {
            if (depth > 0) {
                currentVal += char;
            } else {
                unionList.push(currentVal);
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
    unionList.push(currentVal);

    return unionList.map((t) => parseType(t));
}

export function parseArrayType(type: string): Record<string, any> | string {
    if (type.startsWith('array<')) {
        const array = type.substring('array<'.length, type.length - 1);
        return [parseType(array)];
    }
    return type;
}
