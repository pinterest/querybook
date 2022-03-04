import {
    getRecurrenceLocalTimeString,
    WEEKDAYS,
    MONTHS,
    IRecurrence,
} from 'lib/utils/cron';

function formatMultipleItems(data, executor, initialParam) {
    return data.slice(1).reduce((acc, item, idx, arr) => {
        if (idx === arr.length - 1) {
            return `${acc} and ${executor(item)}`;
        } else {
            return `${acc}, ${executor(item)}`;
        }
    }, initialParam);
}

const hourly = ({ minute }: IRecurrence) =>
    `At ${minute} minutes past the hour, every hour, every day`;

const daily = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    return `At ${localTime}, every day daily`;
};

const weekly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfWeek = formatMultipleItems(
        cronRecurrence.on.dayWeek,
        (i) => WEEKDAYS[i],
        WEEKDAYS[1]
    );

    return `At ${localTime}, only on ${daysOfWeek}, weekly`;
};

const monthly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfMonth = formatMultipleItems(
        cronRecurrence.on.dayMonth,
        (i) => i,
        cronRecurrence.on.dayMonth[0].toString()
    );

    return `At ${localTime}, on day ${daysOfMonth} of the month`;
};

const yearly = (cronRecurrence: IRecurrence) => {
    const localTime = getRecurrenceLocalTimeString(cronRecurrence, 'hh:mm a');
    const daysOfMonth = formatMultipleItems(
        cronRecurrence.on.dayMonth,
        (i) => i,
        cronRecurrence.on.dayMonth[0].toString()
    );

    const months = formatMultipleItems(
        cronRecurrence.on.month,
        (i) => MONTHS[i],
        MONTHS[cronRecurrence.on.month[0]]
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
