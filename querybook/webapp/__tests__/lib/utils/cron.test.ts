import { cronToRecurrence, recurrenceToCron } from 'lib/utils/cron';

test('basic recurrence to cron', () => {
    expect(
        recurrenceToCron({
            hour: 1,
            minute: 1,

            recurrence: 'daily',
            on: [],
        })
    ).toBe('1 1 * * *');
});

test('monthly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 5,
            hour: 4,

            recurrence: 'monthly',
            on: [1, 5, 6],
        })
    ).toBe('5 4 1,5,6 * *');
});

test('weekly to cron', () => {
    expect(
        recurrenceToCron({
            minute: 5,
            hour: 4,

            recurrence: 'weekly',
            on: [1, 5, 6],
        })
    ).toBe('5 4 * * 1,5,6');
});

test('basic cron to recurrence', () => {
    expect(cronToRecurrence('1 1 * * *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'daily',
        on: [],
    });
});

test('monthly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 1,2,3 * *')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'monthly',
        on: [1, 2, 3],
    });
});

test('weekly cron to recurrence', () => {
    expect(cronToRecurrence('1 1 * * 1,2,3')).toStrictEqual({
        hour: 1,
        minute: 1,

        recurrence: 'weekly',
        on: [1, 2, 3],
    });
});
