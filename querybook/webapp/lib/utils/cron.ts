import moment from 'moment';
import * as Yup from 'yup';

export interface IRecurrence {
    hour: number;
    minute: number;

    recurrence: RecurrenceType;
    on: IRecurrenceOn;
    step: IRecurrenceStep;
}

export interface IRecurrenceOn {
    dayMonth?: number[];
    month?: number[];
    dayWeek?: number[];
}

export interface IRecurrenceStep {
    hour?: number;
}

export const recurrenceTypes = [
    'hourly',
    'daily',
    'weekly',
    'monthly',
    'yearly',
];

export type RecurrenceType = typeof recurrenceTypes[number];

export function cronToRecurrence(cron: string): IRecurrence {
    const [minute, hour, dayMonth, month, dayWeek] = cron.split(' ');

    let recurrencePolicy: RecurrenceType = 'daily';
    let on = {};
    let step = {};

    if (dayMonth !== '*' && month !== '*') {
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
    } else if (hour.startsWith('*/') || hour === '*') {
        recurrencePolicy = 'hourly';
        if (hour.startsWith('*/')) {
            step = { hour: Number(hour.split('*/')[1]) };
        } else {
            step = { hour: Number(1) };
        }
    }

    const recurrence: IRecurrence = {
        hour: recurrencePolicy === 'hourly' ? 0 : Number(hour),
        minute: Number(minute),

        recurrence: recurrencePolicy,
        on,
        step,
    };

    return recurrence;
}

export function recurrenceToCron(recurrence: IRecurrence): string {
    const { minute } = recurrence;

    let hour = recurrence.hour.toString();
    let dayMonth = '*';
    let month = '*';
    let dayWeek = '*';
    let hourly = '';

    if (recurrence.recurrence === 'yearly') {
        month = recurrence.on.month.join(',');
        dayMonth = recurrence.on.dayMonth.join(',');
    } else if (recurrence.recurrence === 'monthly') {
        dayMonth = recurrence.on.dayMonth.join(',');
    } else if (recurrence.recurrence === 'weekly') {
        dayWeek = recurrence.on.dayWeek.join(',');
    } else if (recurrence.recurrence === 'hourly') {
        hourly = recurrence.step.hour.toString();
        hour = '*/' + hourly;
    }

    return `${minute} ${hour} ${dayMonth} ${month} ${dayWeek}`;
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

export function validateCronForRecurrrence(cron: string) {
    const cronValArr = cron.split(' ');
    if (cronValArr.length < 5) {
        return false;
    }

    const [minuteStep, _, monthStep, monthDayStep, weekDayStep] =
        cronValArr.map((s) => s.includes('/'));

    // Recurrence does not support step values except for hour
    if (minuteStep || monthStep || monthDayStep || weekDayStep) {
        return false;
    }

    const [minute, hour, month, monthDay, weekDay] = cronValArr.map(
        (s) => s !== '*'
    );
    // Minute and hour must be provided
    if (!(minute && hour)) {
        return false;
    }
    // Recurrence don't current support having both monthday and weekday
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

export const recurrenceStepYup = Yup.object().when(
    'recurrence',
    (recurrence: RecurrenceType, schema) => {
        const stepSchema: any = {};
        if (recurrence === 'hourly') {
            stepSchema.hour = Yup.number().min(1).max(23).min(1).required();
        }

        return Yup.object().shape(stepSchema);
    }
);
