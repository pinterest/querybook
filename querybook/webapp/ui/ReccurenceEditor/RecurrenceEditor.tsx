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

    const getDatePickerField = (
        label: string,
        onKey: string,
        options: { value: number; label: string }[]
    ) => {
        return (
            <FormField label={`Recurrence ${label}`}>
                <Field
                    name={`recurrence.on.${onKey}`}
                    render={({ field }) => (
                        <Select
                            menuPortalTarget={overlayRoot}
                            styles={recurrenceReactSelectStyle}
                            value={options.filter((option: { value: any }) =>
                                field.value?.includes(option.value)
                            )}
                            options={options}
                            onChange={(value) => {
                                const newRecurrence = {
                                    ...recurrence,
                                    on: {
                                        ...recurrence.on,
                                        [onKey]: (value as Array<{
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
    };

    let datePickerField: React.ReactElement;
    if (recurrence.recurrence === 'yearly') {
        datePickerField = (
            <>
                {getDatePickerField('Months', 'month', getYearlyMonthOptions())}
                {getDatePickerField(
                    'Month Days',
                    'dayMonth',
                    getMonthdayOptions()
                )}
            </>
        );
    } else if (recurrence.recurrence === 'monthly') {
        datePickerField = getDatePickerField(
            'Month Days',
            'dayMonth',
            getMonthdayOptions()
        );
    } else if (recurrence.recurrence === 'weekly') {
        datePickerField = getDatePickerField(
            'Week Days',
            'dayWeek',
            getWeekdayOptions()
        );
    }

    return (
        <div className="RecurrenceEditor">
            {hourSecondField}
            {recurrenceTypeField}
            {datePickerField}
        </div>
    );
};
