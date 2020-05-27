import * as React from 'react';
import { Field, FormikErrors } from 'formik';
import moment from 'moment';
import Select from 'react-select';

import {
    getRecurrenceLocalTimeString,
    getWeekdayOptions,
    getMonthdayOptions,
    IRecurrence,
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

type ReccurenceOnType = 'daily' | 'weekly' | 'monthly';

export const RecurrenceEditor: React.FunctionComponent<IProps> = ({
    recurrence,
    recurrenceError,
    setRecurrence,
}) => {
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
                            hour: value.hour(),
                            minute: value.minute(),
                        };
                        setRecurrence(newRecurrence);
                    }}
                />
                <div className="pl8">
                    Local Time:
                    {getRecurrenceLocalTimeString(recurrence)}
                </div>
            </div>
        </FormField>
    );
    const recurrenceTypeField = (
        <FormField label="Recurrence Type">
            <Field name="recurrence.recurrence">
                {({ field }) => (
                    <Tabs
                        items={['daily', 'weekly', 'monthly']}
                        selectedTabKey={field.value}
                        onSelect={(key: ReccurenceOnType) => {
                            const newRecurrence = {
                                ...recurrence,
                                recurrence: key,
                            };
                            if (field.value !== key) {
                                newRecurrence.on = [];
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
        const options =
            recurrence.recurrence === 'weekly'
                ? getWeekdayOptions()
                : getMonthdayOptions();
        datePickerField = (
            <FormField label="Recurrence Days">
                <Field
                    name="recurrence.on"
                    render={({ field }) => (
                        <Select
                            menuPortalTarget={overlayRoot}
                            styles={recurrenceReactSelectStyle}
                            value={options.filter((option) =>
                                field.value.includes(option.value)
                            )}
                            options={options}
                            onChange={(value) => {
                                const newRecurrence = {
                                    ...recurrence,
                                    on: (value as Array<{
                                        value: any;
                                    }>).map((v) => v.value),
                                };
                                setRecurrence(newRecurrence);
                            }}
                            isMulti
                        />
                    )}
                />
            </FormField>
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
