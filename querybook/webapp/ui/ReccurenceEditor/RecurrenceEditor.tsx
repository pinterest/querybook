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
    recurrenceTypes,
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
                    showHour={!(recurrence.recurrence === 'hourly')}
                    showSecond={false}
                    format="H:mm"
                    onChange={(value) => {
                        const newRecurrence = {
                            ...recurrence,
                            hour: value.hour(),
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
                        items={recurrenceTypes}
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

    let datePickerField: React.ReactNode;
    if (recurrence.recurrence === 'yearly') {
        datePickerField = (
            <>
                <RecurrenceEditorDatePicker
                    label="Months"
                    onKey="month"
                    options={getYearlyMonthOptions()}
                    recurrence={recurrence}
                    setRecurrence={setRecurrence}
                />
                <RecurrenceEditorDatePicker
                    label="Month Days"
                    onKey="dayMonth"
                    options={getMonthdayOptions()}
                    recurrence={recurrence}
                    setRecurrence={setRecurrence}
                />
            </>
        );
    } else if (recurrence.recurrence === 'monthly') {
        datePickerField = (
            <RecurrenceEditorDatePicker
                label="Month Days"
                onKey="dayMonth"
                options={getMonthdayOptions()}
                recurrence={recurrence}
                setRecurrence={setRecurrence}
            />
        );
    } else if (recurrence.recurrence === 'weekly') {
        datePickerField = (
            <RecurrenceEditorDatePicker
                label="Week Days"
                onKey="dayWeek"
                options={getWeekdayOptions()}
                recurrence={recurrence}
                setRecurrence={setRecurrence}
            />
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

interface IDatePickerProps {
    label: string;
    onKey: string;
    options: Array<{ value: number; label: string }>;
    recurrence: IRecurrence;
    setRecurrence: (IRecurrence) => void;
}

export const RecurrenceEditorDatePicker: React.FunctionComponent<IDatePickerProps> = ({
    label,
    onKey,
    options,
    recurrence,
    setRecurrence,
}) => {
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
