import * as React from 'react';
import { Field, FormikErrors } from 'formik';
import moment from 'moment';
import Select from 'react-select';

import {
    getRecurrenceLocalTimeString,
    getWeekdayOptions,
    getMonthdayOptions,
    IRecurrence,
    RecurrenceType,
    recurrenceType,
    getYearlyMonthOptions,
} from 'lib/utils/cron';
import { makeReactSelectStyle } from 'lib/utils/react-select';

import { FormField } from 'ui/Form/FormField';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimePicker } from 'ui/TimePicker/TimePicker';
import { overlayRoot } from 'ui/Overlay/Overlay';

const recurrenceReactSelectStyle = makeReactSelectStyle(true);

interface IProps {
    recurrence: IRecurrence;
    recurrenceError?: FormikErrors<IRecurrence>;
    setRecurrence: (val: IRecurrence) => void;
}

export const RecurrenceEditor: React.FunctionComponent<IProps> = ({
    recurrence,
    recurrenceError,
    setRecurrence,
}) => {
    const localTime = React.useMemo(
        () => getRecurrenceLocalTimeString(recurrence),
        [recurrence]
    );

    const hourSecondField = (
        <FormField label="Hour/Minute (UTC)" error={recurrenceError?.hour}>
            <div className="flex-row">
                <TimePicker
                    allowEmpty={false}
                    value={moment()
                        .hour(recurrence.hour)
                        .minute(recurrence.minute)}
                    minuteStep={15}
                    showSecond={false}
                    format="H:mm"
                    onChange={(value) => {
                        const newRecurrence = {
                            ...recurrence,
                            hour:
                                recurrence.recurrence === 'hourly'
                                    ? 0
                                    : value.hour(),
                            minute: value.minute(),
                        };
                        setRecurrence(newRecurrence);
                    }}
                />
                <div className="pl8">
                    Local Time:
                    {localTime}
                </div>
            </div>
        </FormField>
    );
    const recurrenceTypeField = (
        <FormField label="Recurrence Type">
            <Field name="recurrence.recurrence">
                {({ field }) => (
                    <Tabs
                        items={recurrenceType}
                        selectedTabKey={field.value}
                        onSelect={(key: RecurrenceType) => {
                            const newRecurrence = {
                                ...recurrence,
                                recurrence: key,
                            };
                            if (field.value !== key) {
                                newRecurrence.on = {};
                            }
                            setRecurrence(newRecurrence);
                        }}
                        pills
                    />
                )}
            </Field>
        </FormField>
    );

    let datePickerField;
    if (recurrence.recurrence !== 'daily') {
        const name =
            recurrence.recurrence === 'weekly'
                ? 'recurrence.on.dayWeek'
                : 'recurrence.on.dayMonth';
        const options =
            recurrence.recurrence === 'weekly'
                ? getWeekdayOptions()
                : getMonthdayOptions();
        const onChange = (value) => {
            const newRecurrence = {
                ...recurrence,
                on: {
                    ...recurrence.on,
                    [recurrence.recurrence === 'weekly'
                        ? 'dayWeek'
                        : 'dayMonth']: (value as Array<{
                        value: any;
                    }>).map((v) => v.value),
                },
            };
            setRecurrence(newRecurrence);
        };
        datePickerField = (
            <FormField label="Recurrence Days">
                <Field
                    name={name}
                    render={({ field }) => (
                        <Select
                            menuPortalTarget={overlayRoot}
                            styles={recurrenceReactSelectStyle}
                            value={options.filter((option) =>
                                field.value?.includes(option.value)
                            )}
                            options={options}
                            onChange={onChange}
                            isMulti
                        />
                    )}
                />
            </FormField>
        );
        if (recurrence.recurrence === 'yearly') {
            const yearlyOptions = getYearlyMonthOptions();
            const monthPickerField = (
                <FormField label="Recurrence Months">
                    <Field
                        name="recurrence.on.month"
                        render={({ field }) => (
                            <Select
                                menuPortalTarget={overlayRoot}
                                styles={recurrenceReactSelectStyle}
                                value={yearlyOptions.filter((option) =>
                                    field.value?.includes(option.value)
                                )}
                                options={yearlyOptions}
                                onChange={(value) => {
                                    const newRecurrence = {
                                        ...recurrence,
                                        on: {
                                            ...recurrence.on,
                                            month: (value as Array<{
                                                value: any;
                                            }>).map((v) => v.value),
                                        },
                                    };
                                    setRecurrence(newRecurrence);
                                }}
                                isMulti
                            />
                        )}
                    />
                </FormField>
            );
            datePickerField = (
                <>
                    {monthPickerField}
                    {datePickerField}
                </>
            );
        }
    }
    return (
        <div className="RecurrenceEditor">
            {hourSecondField}
            {recurrenceTypeField}
            {datePickerField}
        </div>
    );
};
