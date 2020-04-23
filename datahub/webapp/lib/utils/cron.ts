import moment from 'moment';

export interface IRecurrence {
    hour: number;
    minute: number;

    recurrence: 'daily' | 'weekly' | 'monthly';
    on: number[];
}

export function cronToRecurrence(cron: string): IRecurrence {
    const [minute, hour, dayMonth, _, dayWeek] = cron.split(' ');

    let recurrencePolicy: 'daily' | 'weekly' | 'monthly' = 'daily';
    let on = [];
    if (dayMonth !== '*') {
        recurrencePolicy = 'monthly';
        on = dayMonth.split(',').map((d) => Number(d));
    } else if (dayWeek !== '*') {
        recurrencePolicy = 'weekly';
        on = dayWeek.split(',').map((d) => Number(d));
    }

    const recurrence: IRecurrence = {
        hour: Number(hour),
        minute: Number(minute),

        recurrence: recurrencePolicy,
        on,
    };

    return recurrence;
}

export function recurrenceToCron(recurrence: IRecurrence): string {
    const { hour, minute } = recurrence;

    let dayMonth = '*';
    let dayWeek = '*';

    if (recurrence.recurrence === 'weekly') {
        dayWeek = recurrence.on.join(',');
    } else if (recurrence.recurrence === 'monthly') {
        dayMonth = recurrence.on.join(',');
    }

    return `${minute} ${hour} ${dayMonth} * ${dayWeek}`;
}

const WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];
export function getWeekdayOptions() {
    return WEEKDAYS.map((name, index) => ({
        value: index,
        label: name,
    }));
}

export function getMonthdayOptions() {
    return [...Array(31).keys()].map((day) => ({
        value: day + 1,
        label: String(day + 1),
    }));
}

export function getRecurrenceLocalTimeString(recurrence: IRecurrence): string {
    return moment
        .utc()
        .hour(recurrence.hour)
        .minute(recurrence.minute)
        .local()
        .format('HH:mm');
}

export function getHumanReadableRecurrence(recurrence: IRecurrence): string {
    const { hour, minute, recurrence: freq, on } = recurrence;
    return `At ${hour}:${minute} UTC (Local: ${getRecurrenceLocalTimeString(
        recurrence
    )}) ${freq} ${
        freq !== 'daily'
            ? `on ${(on || [])
                  .map((d) => (freq === 'weekly' ? WEEKDAYS[d] : d))
                  .join(', ')}`
            : ''
    }`;
}

export function validateCronForReuccrence(cron: string) {
    if (cron.includes('/')) {
        return false;
    }

    const minute = Number.isInteger(Number(cron.split(' ')[0]));
    const hour = Number.isInteger(Number(cron.split(' ')[1]));
    const month = Number.isInteger(Number(cron.split(' ')[3]));
    const monthDay = Number.isInteger(Number(cron.split(' ')[2]));
    const weekDay = Number.isInteger(Number(cron.split(' ')[4]));
    if (month || (monthDay && weekDay) || !(minute && hour)) {
        return false;
    }

    return true;
}
