import { Field, FormikErrors } from 'formik';
import moment from 'moment';
import * as React from 'react';
import Select from 'react-select';

import {
    getMonthdayOptions,
    getRecurrenceLocalTimeString,
    getWeekdayOptions,
    getYearlyMonthOptions,
    IRecurrence,
    IRecurrenceOn,
    RecurrenceType,
    recurrenceTypes,
    recurrenceToCron,
} from 'lib/utils/cron';
import { makeReactSelectStyle } from 'lib/utils/react-select';
import { FormField } from 'ui/Form/FormField';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimePicker } from 'ui/TimePicker/TimePicker';
import { NextRun } from 'components/NextRun/NextRun';

import './RecurrenceEditor.scss';

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

    const isHourly = recurrence.recurrence === 'hourly';
    const isDaily = recurrence.recurrence === 'daily';
    const isWeekly = recurrence.recurrence === 'weekly';
    const isMonthly = recurrence.recurrence === 'monthly';
    const isYearly = recurrence.recurrence === 'yearly';
    const recurenceValuesNotSet =
        (!isHourly &&
            !isDaily &&
            isWeekly &&
            (recurrence.on.dayWeek == null ||
                Object.values(recurrence.on.dayWeek).length == 0)) ||
        (isMonthly &&
            (recurrence.on.dayMonth == null ||
                Object.values(recurrence.on.dayMonth).length == 0)) ||
        (isYearly &&
            (recurrence.on.dayMonth == null ||
                recurrence.on.month == null ||
                Object.values(recurrence.on.dayMonth).length == 0 ||
                Object.values(recurrence.on.month).length == 0));

    const schedulingInfoMsgField = (
        <div className="editor-text mr12">
            NOTE: Scheduler uses UTC time. Depending on the timezone, the local
            time a DataDoc runs may appear to be different then expected.
        </div>
    );

    const hourSecondField = (
        <FormField
            label={isHourly ? 'Minute' : 'Hour/Minute (UTC)'}
            error={recurrenceError?.hour}
        >
            <div className="flex-row">
                <TimePicker
                    allowEmpty={false}
                    value={moment()
                        .hour(recurrence.hour)
                        .minute(recurrence.minute)}
                    minuteStep={15}
                    showHour={!isHourly}
                    showSecond={false}
                    format={isHourly ? 'mm' : 'H:mm'}
                    onChange={(value) => {
                        const newRecurrence = {
                            ...recurrence,
                            hour: value.hour(),
                            minute: value.minute(),
                        };
                        setRecurrence(newRecurrence);
                    }}
                />
                <div className="editor-text ml12">
                    {isHourly
                        ? `Every hour at minute ${recurrence.minute} `
                        : `Local Time: ${localTime}`}
                </div>
                <div className="editor-text ml12">
                    <div>
                        {recurenceValuesNotSet ? (
                            'Next Run: Run Options not Set'
                        ) : (
                            <div>
                                {'Next Run: '}
                                <NextRun cron={recurrenceToCron(recurrence)} />
                                {' (Local Time)'}
                            </div>
                        )}
                    </div>
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
    if (isYearly) {
        datePickerField = (
            <>
                <RecurrenceEditorDatePicker
                    label="Months"
                    onKey="month"
                    options={getYearlyMonthOptions()}
                    error={recurrenceError?.on}
                    recurrence={recurrence}
                    setRecurrence={setRecurrence}
                />
                <RecurrenceEditorDatePicker
                    label="Month Days"
                    onKey="dayMonth"
                    options={getMonthdayOptions()}
                    error={recurrenceError?.on}
                    recurrence={recurrence}
                    setRecurrence={setRecurrence}
                />
            </>
        );
    } else if (isMonthly) {
        datePickerField = (
            <RecurrenceEditorDatePicker
                label="Month Days"
                onKey="dayMonth"
                options={getMonthdayOptions()}
                error={recurrenceError?.on}
                recurrence={recurrence}
                setRecurrence={setRecurrence}
            />
        );
    } else if (isWeekly) {
        datePickerField = (
            <RecurrenceEditorDatePicker
                label="Week Days"
                onKey="dayWeek"
                options={getWeekdayOptions()}
                error={recurrenceError?.on}
                recurrence={recurrence}
                setRecurrence={setRecurrence}
            />
        );
    }

    return (
        <div className="RecurrenceEditor">
            {schedulingInfoMsgField}
            {hourSecondField}
            {recurrenceTypeField}
            {datePickerField}
        </div>
    );
};

interface IOptionType {
    value: number;
    label: string;
}
interface IDatePickerProps {
    label: string;
    onKey: string;
    options: IOptionType[];
    recurrence: IRecurrence;
    setRecurrence: (recurrence: IRecurrence) => void;
    error: FormikErrors<IRecurrenceOn>;
}

export const RecurrenceEditorDatePicker: React.FunctionComponent<
    IDatePickerProps
> = ({ label, onKey, options, error, recurrence, setRecurrence }) => {
    const formattedError = (error?.[onKey] || '').replace(
        `recurrence.on.${onKey}`,
        label
    );
    return (
        <FormField label={`Recurrence ${label}`} error={formattedError}>
            <Field
                name={`recurrence.on.${onKey}`}
                render={({ field }) => (
                    <Select<IOptionType, true>
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
                                    [onKey]: value.map((v) => v.value),
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
