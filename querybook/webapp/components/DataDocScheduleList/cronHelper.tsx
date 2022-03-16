import {
    getRecurrenceLocalTimeString,
    WEEKDAYS,
    MONTHS,
    IRecurrence,
} from 'lib/utils/cron';

/**
 * Turns a list of items into a sentence, for example
 * ['apple', 'banana'] -> apple and banana
 * ['apple', 'banana', 'milk'] -> apple, banana and milk
 *
 * @param items string[] list of items
 */
function formatItemsSentence(items: string[]) {
    if (items.length < 3) {
        return items.join(' and ');
    } else {
        const allExceptLast = items.slice(0, -1).join(', ');
        return allExceptLast + ` and ${items[items.length - 1]}`;
    }
}

const hourly = ({ minute }: IRecurrence) =>
    `At ${minute} minutes past the hour, every hour, every day`;

const daily = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    return `At ${localTime}, every day daily`;
};

const weekly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfWeek = formatItemsSentence(
        cronRecurrence.on.dayWeek.map((day) => WEEKDAYS[day])
    );

    return `At ${localTime}, only on ${daysOfWeek}, weekly`;
};

const monthly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfMonth = formatItemsSentence(
        cronRecurrence.on.dayMonth.map(String)
    );

    return `At ${localTime}, on day ${daysOfMonth} of the month`;
};

const yearly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfMonth = formatItemsSentence(
        cronRecurrence.on.dayMonth.map(String)
    );

    const months = formatItemsSentence(
        cronRecurrence.on.month.map((m) => MONTHS[m - 1])
    );
    return `At ${localTime}, on day ${daysOfMonth} of the month, only in ${months}`;
};

export const cronFormatter = (recurrence: IRecurrence) => {
    const recurrenceType = recurrence.recurrence;
    if (recurrenceType === 'hourly') {
        return hourly(recurrence);
    } else if (recurrenceType === 'daily') {
        return daily(recurrence);
    } else if (recurrenceType === 'weekly') {
        return weekly(recurrence);
    } else if (recurrenceType === 'monthly') {
        return monthly(recurrence);
    } else if (recurrenceType === 'yearly') {
        return yearly(recurrence);
    }
};
