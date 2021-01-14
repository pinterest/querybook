import { formatDuration, generateFormattedDate } from 'lib/utils/datetime';
import moment from 'moment';

const testTimeStamp1 = 1300000000;
const testTimeStamp2 = 1300000379;

test('formatDuration seconds', () => {
    expect(
        formatDuration(
            moment.duration(testTimeStamp2 - testTimeStamp1, 'seconds')
        )
    ).toBe('6m 19s');
});

test('formatDuration invalid input', () => {
    expect(formatDuration(moment.duration('bad input'))).toBe('0s');
});

test('generateFormattedDate unix timestamp', () => {
    expect(generateFormattedDate(testTimeStamp1)).toBe('Mar 12 2011, 11:06pm');
    expect(generateFormattedDate(testTimeStamp1, 'X')).toBe(
        'Mar 12 2011, 11:06pm'
    );
});
