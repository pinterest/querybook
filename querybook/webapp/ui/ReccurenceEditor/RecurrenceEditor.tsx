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
} from 'lib/utils/cron';
import { makeReactSelectStyle } from 'lib/utils/react-select';
import { FormField } from 'ui/Form/FormField';
import { overlayRoot } from 'ui/Overlay/Overlay';
import { Tabs } from 'ui/Tabs/Tabs';
import { TimePicker } from 'ui/TimePicker/TimePicker';

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

    const hourSecondField = (
        <FormField label={'Hour/Minute (UTC)'} error={recurrenceError?.hour}>
            <div className="flex-row">
                {recurrence.recurrence === 'hourly'
                    ? [
                          <div className="editor-text mr12">{'Every'}</div>,
                          <TimePicker
                              allowEmpty={false}
                              value={moment().hour(recurrence.step.hour)}
                              showHour={true}
                              showMinute={false}
                              showSecond={false}
                              disabledHours={() => [0]}
                              hideDisabledOptions
                              format={'H'}
                              onChange={(value) => {
                                  const newRecurrence = {
                                      ...recurrence,
                                      step: { hour: value.hour() },
                                  };
                                  setRecurrence(newRecurrence);
                              }}
                          />,
                          <div className="editor-text ml12 mr12">
                              {'hours at minute'}
                          </div>,
                      ]
                    : ''}

                <TimePicker
                    allowEmpty={false}
                    value={
                        recurrence.recurrence === 'hourly'
                            ? moment().minute(recurrence.minute)
                            : moment()
                                  .hour(recurrence.hour)
                                  .minute(recurrence.minute)
                    }
                    minuteStep={15}
                    showHour={!(recurrence.recurrence === 'hourly')}
                    showSecond={false}
                    format={isHourly ? 'mm' : 'H:mm'}
                    onChange={(value) => {
                        if (recurrence.recurrence === 'hourly') {
                            const newRecurrence = {
                                ...recurrence,
                                minute: value.minute(),
                            };
                            setRecurrence(newRecurrence);
                        } else {
                            const newRecurrence = {
                                ...recurrence,
                                hour: value.hour(),
                                minute: value.minute(),
                            };
                            setRecurrence(newRecurrence);
                        }
                    }}
                />
                <div className="editor-text ml12">
                    {recurrence.recurrence === 'hourly'
                        ? ``
                        : `Local Time: ${localTime}`}
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
                            if (key === 'hourly' && !newRecurrence.step.hour) {
                                newRecurrence.step.hour = Number(1);
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
    } else if (recurrence.recurrence === 'monthly') {
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
    } else if (recurrence.recurrence === 'weekly') {
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
