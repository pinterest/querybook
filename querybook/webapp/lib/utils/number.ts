export enum ByteSizes {
    bit = 0,
    byte = 1,
    kb = 2,
    mb = 3,
    gb = 4,
    tb = 5,
    pb = 6,
    eb = 7,
}
export function getHumanReadableByteSize(
    size: number,
    fromUnit: ByteSizes = ByteSizes.byte
): string {
    let currentUnit = fromUnit;
    while (size < 1 && currentUnit !== ByteSizes.bit) {
        currentUnit = ByteSizes[ByteSizes[currentUnit - 1]];
        size *= 1024;
    }
    while (size > 1024 && currentUnit !== ByteSizes.eb) {
        currentUnit = ByteSizes[ByteSizes[currentUnit + 1]];
        size /= 1024;
    }

    return `${size.toFixed(2)} ${ByteSizes[currentUnit].toUpperCase()}s`;
}

export function formatNumber(
    rawNum: number | string,
    unit: string = '',
    options: Intl.NumberFormatOptions = {}
) {
    const num = Number(rawNum);
    if (!isNumeric(num)) {
        return rawNum as string;
    } else {
        const numString = num.toLocaleString('en-us', options);
        const unitString = unit ? ` ${unit}${num > 1 ? 's' : ''}` : '';
        return numString + unitString;
    }
}

const humanReadableUnits = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi'];
export function getHumanReadableNumber(
    rawNum: number | string,
    decimal: number = 2
): string {
    const num = Number(rawNum);
    if (!isNumeric(num)) {
        return rawNum as string;
    } else {
        const sign = num < 0 ? '-' : '';
        const absNum = Math.abs(num);

        // We take the floor of log, so we calculate n for baseNum * 1000^n ~= num
        const n = Math.floor(Math.log(absNum) / Math.log(1000));

        // if the number is way too large (this shouldn't happen)
        // or too small (< 1)
        if (n < 0 || humanReadableUnits.length <= n) {
            return String(roundNumberToDecimal(num, decimal));
        }

        // We ensure that human readable num is no larger than 1000
        const baseNum = absNum / Math.pow(1000, n);
        return `${sign}${roundNumberToDecimal(baseNum, decimal)}${
            humanReadableUnits[n]
        }`;
    }
}

export function roundNumberToDecimal(n: number, decimalPlaces: number) {
    const baseDiv = Math.pow(10, decimalPlaces);
    return Math.round((n + Number.EPSILON) * baseDiv) / baseDiv;
}

export function isNumeric(n: any): boolean {
    if (typeof n === 'string') {
        // typescript thinks isNaN can only take number
        return !isNaN(n as any) && !isNaN(parseFloat(n));
    } else if (typeof n === 'number') {
        return !isNaN(n);
    } else if (typeof n === 'bigint') {
        return true;
    }
    return false;
}
