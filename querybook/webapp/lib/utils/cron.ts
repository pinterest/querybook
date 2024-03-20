import moment from 'moment';
import * as Yup from 'yup';

export interface IRecurrence {
    hour: number;
    minute: number;

    recurrence: RecurrenceType;
    on: IRecurrenceOn;

    cron?: string;
}

export interface IRecurrenceOn {
    dayMonth?: number[];
    month?: number[];
    dayWeek?: number[];
}

export const recurrenceTypes = [
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
    'cron',
];

export type RecurrenceType = typeof recurrenceTypes[number];

export function cronToRecurrence(cron: string): IRecurrence {
    const [minute, hour, dayMonth, month, dayWeek] = cron.split(' ');

    let recurrencePolicy: RecurrenceType = 'daily';
    let on = {};

    // If cron is not supported via the Recurrence editor, then we default to cron type
    if (!validateCronForRecurrrence(cron)) {
        recurrencePolicy = 'cron';
    } else if (dayMonth !== '*' && month !== '*') {
        recurrencePolicy = 'yearly';
        on = {
            month: month.split(',').map((d) => Number(d)),
            dayMonth: dayMonth.split(',').map((d) => Number(d)),
        };
    } else if (dayMonth !== '*') {
        recurrencePolicy = 'monthly';
        on = { dayMonth: dayMonth.split(',').map((d) => Number(d)) };
    } else if (dayWeek !== '*') {
        recurrencePolicy = 'weekly';
        on = { dayWeek: dayWeek.split(',').map((d) => Number(d)) };
    } else if (hour === '*') {
        recurrencePolicy = 'hourly';
    }

    if (recurrencePolicy === 'cron') {
        return {
            recurrence: 'cron',
            cron,
            hour: 0,
            minute: 0,
            on,
        };
    }

    const recurrence: IRecurrence = {
        hour: recurrencePolicy === 'hourly' ? 0 : Number(hour),
        minute: Number(minute),

        recurrence: recurrencePolicy,
        on,

        cron,
    };

    return recurrence;
}

export function recurrenceToCron(recurrence: IRecurrence): string {
    if (recurrence.recurrence === 'cron') {
        return recurrence.cron;
    }

    try {
        const { minute } = recurrence;

        let hour = recurrence.hour.toString();
        let dayMonth = '*';
        let month = '*';
        let dayWeek = '*';

        if (recurrence.recurrence === 'yearly') {
            month = recurrence.on.month.join(',');
            dayMonth = recurrence.on.dayMonth.join(',');
        } else if (recurrence.recurrence === 'monthly') {
            dayMonth = recurrence.on.dayMonth.join(',');
        } else if (recurrence.recurrence === 'weekly') {
            dayWeek = recurrence.on.dayWeek.join(',');
        } else if (recurrence.recurrence === 'hourly') {
            hour = '*';
        }

        return `${minute} ${hour} ${dayMonth} ${month} ${dayWeek}`;
    } catch (error) {
        return '';
    }
}

export const WEEKDAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
];

export const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
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

export function getYearlyMonthOptions() {
    return [...Array(12).keys()].map((month) => ({
        value: month + 1,
        label: MONTHS[month],
    }));
}

export function getRecurrenceLocalTimeString(
    recurrence: IRecurrence,
    format = 'HH:mm'
): string {
    return moment
        .utc()
        .hour(recurrence.hour)
        .minute(recurrence.minute)
        .local()
        .format(format);
}

/**
 * Determines whether a cron string is supported by the recurrence editor.
 *
 * @param cron Cron string to validate
 * @returns true if cron string is supported by recurrence editor, false otherwise
 */
export function validateCronForRecurrrence(cron: string) {
    if (cron.includes('/')) {
        return false;
    }

    // Recurrence does not support ranges
    if (cron.includes('-')) {
        return false;
    }

    const cronValArr = cron.split(' ');
    if (cronValArr.length < 5) {
        return false;
    }

    const [minuteList, hourList] = cronValArr.map((s) => s.includes(','));

    // Recurrence does not support lists for minute and hour
    if (minuteList || hourList) {
        return false;
    }

    const [minute, hour, monthDay, month, weekDay] = cronValArr.map(
        (s) => s !== '*'
    );

    const isHourly = minute && !hour && !monthDay && !month && !weekDay;

    // Minute and hour must be provided unless hourly
    if (!(minute && hour) && !isHourly) {
        return false;
    }

    // Recurrence doesn't current support having both monthday and weekday
    if ((monthDay || month) && weekDay) {
        return false;
    }

    return true;
}

export const recurrenceOnYup = Yup.object().when(
    'recurrence',
    (recurrence: RecurrenceType, schema) => {
        const onSchema: any = {};
        if (recurrence === 'weekly') {
            onSchema.dayWeek = Yup.array()
                .min(1)
                .of(Yup.number().min(0).max(6))
                .required();
        } else if (recurrence === 'monthly' || recurrence === 'yearly') {
            onSchema.dayMonth = Yup.array()
                .min(1)
                .of(Yup.number().min(1).max(31))
                .required();

            if (recurrence === 'yearly') {
                onSchema.month = Yup.array()
                    .min(1)
                    .of(Yup.number().min(1).max(12))
                    .required();
            }
        }

        return Yup.object().shape(onSchema);
    }
);
