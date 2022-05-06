import React, { useReducer, useCallback, useMemo } from 'react';
import moment, { Moment } from 'moment';
import styled from 'styled-components';

import { SearchDatePicker } from 'components/Search/SearchDatePicker';
import { FormField } from 'ui/Form/FormField';
import { TimePicker } from 'ui/TimePicker/TimePicker';
import { Tabs } from 'ui/Tabs/Tabs';
import NumberInput from 'ui/NumberInput/NumberInput';
import { Button } from 'ui/Button/Button';

import { reducer } from './reducer';

const TimerDiv = styled.div`
    text-decoration: underline;
    cursor: pointer;
`;

const SearchDatePickerWrapper = styled(SearchDatePicker)`
    margin-bottom: 0;

    input {
        padding: 3px;
    }
`;

const NumberInputWrapper = styled(NumberInput)`
    max-width: 41%;
    margin-bottom: 10px;
    display: block;
`;

function combineDateWithTime(date, prevValue) {
    return moment(date)
        .hours(prevValue.hours())
        .minutes(prevValue.minutes())
        .format('X');
}

function getTimePickerValue(value) {
    return value
        ? moment(value, 'X').local()
        : moment(new Date(), 'X').minutes(0).hours(0);
}

function formatTimeLabel(value) {
    return value
        ? `${moment(value, 'X').local().format('YYYY-MM-DD HH:mm')}`
        : '--:--';
}

function generateRangeLabel(timeRange, totalRunCount) {
    if (timeRange.occurrences) {
        return `${timeRange.occurrences} time(s) of ${totalRunCount ?? 0}`;
    }

    return `${formatTimeLabel(timeRange.startTime)} -
${formatTimeLabel(timeRange.endTime)}`;
}

function getValueOrNow(value) {
    return value ? moment(value, 'X') : moment();
}

const tabs = [
    { name: 'Time range', key: 'timeRange' },
    { name: 'occurrences', key: 'occurrences' },
];

type DataDocScheduleType = {
    occurrences?: number;
    startTime?: string;
    endTime?: string;
};

interface IScheduleRangeFieldProps {
    updateValues: (values: DataDocScheduleType) => void;
    values: DataDocScheduleType;
    totalRunCount: number;
}

export const ScheduleRangeField: React.FunctionComponent<
    IScheduleRangeFieldProps
> = ({ values, updateValues, totalRunCount }) => {
    const { startTime, endTime, occurrences } = values;
    const [state, dispatch] = useReducer(reducer, {
        isEditableMode: false,
        activeTab: occurrences ? tabs[1].key : tabs[0].key,
        dateRange: {
            startTime,
            endTime,
            occurrences,
        },
    });

    const onSaveCallback = useCallback(
        (event) => {
            event.preventDefault();
            let values = {};
            if (state.activeTab === tabs[0].key) {
                values = {
                    startTime: state.dateRange.startTime,
                    endTime: state.dateRange.endTime,
                    occurrences: null,
                };
            } else {
                values = {
                    startTime: null,
                    endTime: null,
                    occurrences: state.dateRange.occurrences,
                };
            }

            updateValues(values);

            dispatch({
                type: 'SAVE_VALUES',
                values,
            });
        },
        [state.dateRange, state.activeTab, updateValues]
    );

    const onCancelCallback = useCallback(() => {
        dispatch({
            type: 'CANCEL_VALUES',
            values: {
                startTime,
                endTime,
                occurrences,
            },
        });
    }, [startTime, endTime, occurrences]);

    const onChangeDatePicker = useCallback(
        (value: string, key: string) => {
            const prevValue = moment(state.dateRange[key], 'X');

            dispatch({
                type: 'UPDATE_VALUES',
                values: {
                    [key]: combineDateWithTime(value, prevValue),
                },
            });
        },
        [state.dateRange]
    );

    const onChangeTimePicker = useCallback(
        (value: Moment, key: string) => {
            const prevDate = getValueOrNow(state.dateRange[key]);

            value.dayOfYear(prevDate.dayOfYear());
            dispatch({
                type: 'UPDATE_VALUES',
                values: {
                    [key]: moment(value).format('X'),
                },
            });
        },
        [state.dateRange]
    );

    const handleOccurencesChange = useCallback(
        (value) =>
            dispatch({
                type: 'UPDATE_VALUES',
                values: {
                    occurrences: value,
                },
            }),
        []
    );

    const handleTabSelect = useCallback(
        (key) =>
            dispatch({
                type: 'CHANGE_ACTIVE_TAB',
                tab: key,
            }),
        []
    );

    const onSwitchToEditMode = useCallback(
        () =>
            dispatch({
                type: 'SWITCH_EDITABLE_MODE',
                mode: true,
            }),
        []
    );

    const isExecutionRangeSet = useMemo(
        () => Object.values(state.dateRange).filter((i) => i).length !== 0,
        [state.dateRange]
    );

    return (
        <div>
            <FormField label={'Execution range:'}>
                {state.isEditableMode ? (
                    <div>
                        <div className="pb12">
                            <Tabs
                                items={tabs}
                                selectedTabKey={state.activeTab}
                                onSelect={handleTabSelect}
                                pills
                            />
                        </div>
                        {state.activeTab === tabs[0].key ? (
                            <>
                                <div className="flex-row mb12">
                                    <SearchDatePickerWrapper
                                        name=""
                                        onChange={(e) =>
                                            onChangeDatePicker(
                                                e.target.value,
                                                'startTime'
                                            )
                                        }
                                        id="startTime"
                                        value={state.dateRange.startTime}
                                    />
                                    <TimePicker
                                        className="ml12"
                                        allowEmpty={false}
                                        value={getTimePickerValue(
                                            state.dateRange.startTime
                                        )}
                                        minuteStep={15}
                                        showHour={true}
                                        showSecond={false}
                                        format={'H:mm'}
                                        onChange={(time: Moment) =>
                                            onChangeTimePicker(
                                                time,
                                                'startTime'
                                            )
                                        }
                                    />
                                </div>
                                <div className="flex-row mb12">
                                    <SearchDatePickerWrapper
                                        name=""
                                        onChange={(e) =>
                                            onChangeDatePicker(
                                                e.target.value,
                                                'endTime'
                                            )
                                        }
                                        id="endTime"
                                        value={state.dateRange.endTime}
                                    />
                                    <TimePicker
                                        className="ml12"
                                        allowEmpty={false}
                                        value={getTimePickerValue(
                                            state.dateRange.endTime
                                        )}
                                        minuteStep={15}
                                        showHour={true}
                                        showSecond={false}
                                        format={'H:mm'}
                                        onChange={(time: Moment) =>
                                            onChangeTimePicker(time, 'endTime')
                                        }
                                    />
                                </div>
                            </>
                        ) : (
                            <NumberInputWrapper
                                label=""
                                name="occurrences"
                                type="number"
                                value={state.dateRange.occurrences}
                                onChange={handleOccurencesChange}
                            />
                        )}
                        <Button onClick={onSaveCallback}>Confirm</Button>
                        <Button onClick={onCancelCallback}>Cancel</Button>
                    </div>
                ) : (
                    <div className="flex-row">
                        <TimerDiv onClick={onSwitchToEditMode}>
                            {generateRangeLabel(state.dateRange, totalRunCount)}{' '}
                        </TimerDiv>
                        {isExecutionRangeSet && (
                            <Button
                                icon="X"
                                title="Reset"
                                className="ml12"
                                onClick={() => {
                                    updateValues({
                                        startTime: null,
                                        endTime: null,
                                        occurrences: null,
                                    });
                                    dispatch({ type: 'RESET_VALUES' });
                                }}
                            />
                        )}
                    </div>
                )}
            </FormField>
        </div>
    );
};
