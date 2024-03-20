import {
    cronToRecurrence,
    recurrenceToCron,
    validateCronForRecurrrence,
} from 'lib/utils/cron';

test('basic recurrence to cron', () => {
    expect(
        recurrenceToCron({
            hour: 1,
            minute: 1,

            recurrence: 'daily',
            on: {},
        })
    ).toBe('1 1 * * *');
});

test('yearly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 0,
            hour: 0,

            recurrence: 'yearly',
            on: { dayMonth: [1, 15], month: [3, 6, 9, 12] },
        })
    ).toBe('0 0 1,15 3,6,9,12 *');
});

test('monthly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 5,
            hour: 4,

            recurrence: 'monthly',
            on: { dayMonth: [1, 5, 6] },
        })
    ).toBe('5 4 1,5,6 * *');
});

test('weekly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 5,
            hour: 4,

            recurrence: 'weekly',
            on: { dayWeek: [1, 5, 6] },
        })
    ).toBe('5 4 * * 1,5,6');
});

test('hourly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 30,
            hour: 0,

            recurrence: 'hourly',
            on: {},
        })
    ).toBe('30 * * * *');
});

test('basic cron to recurrence', () => {
    expect(cronToRecurrence('1 1 * * *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'daily',
        on: {},
        cron: '1 1 * * *',
    });
});

test('yearly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 1,2,3 3,6,9,12 *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'yearly',
        on: { dayMonth: [1, 2, 3], month: [3, 6, 9, 12] },
        cron: '1 1 1,2,3 3,6,9,12 *',
    });
});

test('monthly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 1,2,3 * *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'monthly',
        on: { dayMonth: [1, 2, 3] },
        cron: '1 1 1,2,3 * *',
    });
});

test('weekly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 * * 1,2,3')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'weekly',
        on: { dayWeek: [1, 2, 3] },
        cron: '1 1 * * 1,2,3',
    });
});

test('hourly cron to recurrence', () => {
    expect(cronToRecurrence('1 * * * *')).toStrictEqual({
        hour: 0,
        minute: 1,

        recurrence: 'hourly',
        on: {},
        cron: '1 * * * *',
    });
});

test('every 5 minutes cron to recurrence', () => {
    expect(cronToRecurrence('*/5 * * * *')).toStrictEqual({
        hour: 0,
        minute: 0,

        recurrence: 'cron',
        on: {},
        cron: '*/5 * * * *',
    });
});

test('at 22:00 on every day-of-week from Monday through Friday cron to recurrence', () => {
    expect(cronToRecurrence('0 22 * * 1-5')).toStrictEqual({
        hour: 0,
        minute: 0,

        recurrence: 'cron',
        on: {},
        cron: '0 22 * * 1-5',
    });
});

test('at minute 0 past hour 0 and 12 on day-of-month 1 and 15 in January and July cron to recurrence', () => {
    expect(cronToRecurrence('0 0,12 1,15 1,7 *')).toStrictEqual({
        hour: 0,
        minute: 0,

        recurrence: 'cron',
        on: {},
        cron: '0 0,12 1,15 1,7 *',
    });
});

test('validate hourly cron', () => {
    expect(validateCronForRecurrrence('0 * * * *')).toBe(true);
});
test('validate daily cron', () => {
    expect(validateCronForRecurrrence('1 1 * * *')).toBe(true);
});
test('validate weekly cron', () => {
    expect(validateCronForRecurrrence('0 0 * * 1,3,5')).toBe(true);
});
test('validate monthly cron', () => {
    expect(validateCronForRecurrrence('0 0 1,15 1,7 *')).toBe(true);
});
test('validate cron with step', () => {
    expect(validateCronForRecurrrence('*/30 * * * *')).toBe(false);
});
test('validate cron with range', () => {
    expect(validateCronForRecurrrence('0 22 * * 1-5')).toBe(false);
});
test('validate cron with minute and hour lists', () => {
    expect(validateCronForRecurrrence('30 0,1,2 * * *')).toBe(false);
});
test('validate cron with minute list', () => {
    expect(validateCronForRecurrrence('0,15,30,45 * * * *')).toBe(false);
});
test('validate cron with monthday and weekday', () => {
    expect(validateCronForRecurrrence('0 0 1,15 * 1,7')).toBe(false);
});
test('validate cron with missing minute', () => {
    expect(validateCronForRecurrrence('* 0 * * *')).toBe(false);
});
test('validate cron with missing minute and hour', () => {
    expect(validateCronForRecurrrence('* * * * *')).toBe(false);
});
