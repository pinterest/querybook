import {
    getHumanReadableByteSize,
    formatNumber,
    getHumanReadableNumber,
    ByteSizes,
    roundNumberToDecimal,
    isNumeric,
} from 'lib/utils/number';

test('getHumanReadableByteSize', () => {
    expect(getHumanReadableByteSize(292059314)).toBe('278.53 MBs');
    expect(getHumanReadableByteSize(292059314, ByteSizes.kb)).toBe(
        '278.53 GBs'
    );
});

test('formatNumber', () => {
    expect(formatNumber(0, 'kitten')).toStrictEqual('0 kitten');
    expect(formatNumber(1, 'kitten')).toStrictEqual('1 kitten');
    expect(formatNumber(3, 'kitten')).toStrictEqual('3 kittens');
    expect(formatNumber(9999, 'kitten')).toStrictEqual('9,999 kittens');

    expect(formatNumber(123)).toStrictEqual('123');
    expect(formatNumber(1234.123)).toStrictEqual('1,234.123');
    expect(
        formatNumber(1234.123, '', { maximumFractionDigits: 2 })
    ).toStrictEqual('1,234.12');
    expect(
        formatNumber(1234, 'kitten', { minimumFractionDigits: 2 })
    ).toStrictEqual('1,234.00 kittens');
});

test('getHumanReadableNumber', () => {
    expect(getHumanReadableNumber(-0.567, 2)).toBe('-0.57');
    expect(getHumanReadableNumber(0.567, 2)).toBe('0.57');

    expect(getHumanReadableNumber(512, 0)).toBe('512');
    expect(getHumanReadableNumber(1000)).toBe('1K');
    expect(getHumanReadableNumber(1000, 0)).toBe('1K');

    expect(getHumanReadableNumber(1234567, 3)).toBe('1.235M');
    expect(getHumanReadableNumber(-1234567, 3)).toBe('-1.235M');
    expect(getHumanReadableNumber('1234567', 3)).toBe('1.235M');

    expect(getHumanReadableNumber('1.23e+5', 2)).toBe('123K');
    // too large
    expect(getHumanReadableNumber('1.23e+70', 2)).toBe('1.23e+70');

    // Not a number
    expect(getHumanReadableNumber('Not a number')).toBe('Not a number');
});

test('roundNumberToDecimal', () => {
    expect(roundNumberToDecimal(1.005, 2)).toBe(1.01);
    expect(roundNumberToDecimal(10, 2)).toBe(10);
    expect(roundNumberToDecimal(1.7777777, 2)).toBe(1.78);
    expect(roundNumberToDecimal(9.1, 2)).toBe(9.1);
    expect(roundNumberToDecimal(1234.5678, 2)).toBe(1234.57);
});

test('isNumeric', () => {
    expect(isNumeric(123)).toBe(true);
    expect(isNumeric('123')).toBe(true);
    expect(isNumeric('123.123')).toBe(true);

    expect(isNumeric('not number')).toBe(false);
    expect(isNumeric('Not a number')).toBe(false);

    expect(isNumeric('123not')).toBe(false);
    expect(isNumeric('123 not')).toBe(false);
    expect(isNumeric('123e+1000')).toBe(true);

    expect(isNumeric('')).toBe(false);
    expect(isNumeric(null)).toBe(false);
    expect(isNumeric(undefined)).toBe(false);
    expect(isNumeric(NaN)).toBe(false);
    expect(isNumeric([])).toBe(false);
    expect(isNumeric([123])).toBe(false);
});
