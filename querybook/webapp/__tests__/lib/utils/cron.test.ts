import { cronToRecurrence, recurrenceToCron } from 'lib/utils/cron';

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
    });
});

test('yearly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 1,2,3 3,6,9,12 *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'yearly',
        on: { dayMonth: [1, 2, 3], month: [3, 6, 9, 12] },
    });
});

test('monthly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 1,2,3 * *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'monthly',
        on: { dayMonth: [1, 2, 3] },
    });
});

test('weekly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 * * 1,2,3')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'weekly',
        on: { dayWeek: [1, 2, 3] },
    });
});

test('hourly cron to recurrence', () => {
    expect(cronToRecurrence('1 * * * *')).toStrictEqual({
        hour: 0,
        minute: 1,

        recurrence: 'hourly',
        on: {},
    });
});
