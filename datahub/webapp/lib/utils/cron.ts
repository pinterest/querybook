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

export function validateCronForReuccrence(cron: string) {
    if (cron.includes('/')) {
        return false;
    }

    const cronValArr = cron.split(' ');
    if (cronValArr.length < 5) {
        return false;
    }

    const [minute, hour, month, monthDay, weekDay] = cronValArr.map((s) =>
        Number.isInteger(Number(s))
    );
    if (month || (monthDay && weekDay) || !(minute && hour)) {
        return false;
    }

    return true;
}
