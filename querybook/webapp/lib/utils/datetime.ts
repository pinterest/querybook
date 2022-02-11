import moment from 'moment';

/**
 * Format a moment js duration into readable format
 * Can show hours, minutes, seconds
 * Example output: "1h 2m 5s", "2m 5s", "5s"
 *
 * @param duration moment.Duration
 * @returns string
 */
export function formatDuration(duration: moment.Duration) {
    const seconds = duration.seconds();
    const minutes = duration.minutes();
    const hours = Number(duration.hours()); // highest level

    const durationString = [
        hours > 0 ? `${hours}h` : '',
        minutes > 0 ? `${minutes}m` : '',
        `${seconds}s`,
    ]
        .join(' ')
        .trim();

    return durationString;
}

// DATE UTILS
export function generateFormattedDate(utcTime: number, momentFormat = 'X') {
    // Note utcTime is by defualt a unix timestamp (in seconds),
    // thus the 'X' default format.
    const utcDate = moment.utc(utcTime, momentFormat);
    const localDate = utcDate.local();
    const format =
        localDate.year() === moment().local().year()
            ? 'MMM D, h:mma'
            : 'MMM D YYYY, h:mma';
    return localDate.format(format);
}

export function fromNow(utcTime: number, momentFormat = 'X') {
    return moment.utc(utcTime, momentFormat).fromNow();
}
