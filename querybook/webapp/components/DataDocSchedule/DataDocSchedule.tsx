import React from 'react';
import toast from 'react-hot-toast';

import { IScheduleTabs } from 'components/DataDocRightSidebar/DataDocScheduleModal';
import { useResource } from 'hooks/useResource';
import { DataDocScheduleResource } from 'resource/dataDoc';

import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { EmptyText } from 'ui/StyledText/StyledText';
import { formatDateValue } from 'lib/utils/datetime';

import { DataDocScheduleForm } from './DataDocScheduleForm';
import { DataDocScheduleRunLogs } from './DataDocScheduleRunLogs';

interface IDataDocScheduleFormWrapperProps {
    docId: number;
    isEditable: boolean;
    onSave?: () => void;
    onDelete?: () => void;
}
interface IDataDocScheduleProps extends IDataDocScheduleFormWrapperProps {
    currentTab: IScheduleTabs;
}

export const DataDocScheduleFormWrapper: React.FunctionComponent<
    IDataDocScheduleFormWrapperProps
> = ({ docId, isEditable, onSave, onDelete }) => {
    const { isLoading, isError, data, forceFetch } = useResource(
        React.useCallback(() => DataDocScheduleResource.get(docId), [docId])
    );

    if (isLoading) {
        return <Loading />;
    }
    if (isError) {
        return <ErrorMessage>Error Loading DataDoc Schedule</ErrorMessage>;
    }

    if (data || isEditable) {
        // When editable, make create/update form
        return (
            <DataDocScheduleForm
                isEditable={isEditable}
                docId={docId}
                cron={data?.cron ?? null}
                enabled={data?.enabled ?? false}
                kwargs={data?.kwargs ?? {}}
                startTime={data?.start_time}
                endTime={data?.end_time}
                occurrences={data?.occurrences}
                totalRunCount={data?.total_run_count}
                onCreate={(cron, kwargs, startTime, endTime, occurrences) =>
                    DataDocScheduleResource.create(docId, {
                        cron,
                        kwargs,
                        start_time: formatDateValue(startTime),
                        end_time: formatDateValue(endTime),
                        occurrences,
                    }).then(() => {
                        toast.success('Schedule Created!');
                        forceFetch();
                        if (onSave) {
                            onSave();
                        }
                    })
                }
                onUpdate={(
                    cron,
                    enabled,
                    kwargs,
                    startTime,
                    endTime,
                    occurrences
                ) =>
                    DataDocScheduleResource.update(docId, {
                        cron,
                        kwargs,
                        enabled,
                        start_time: formatDateValue(startTime),
                        end_time: formatDateValue(endTime),
                        occurrences,
                    }).then(() => {
                        toast.success('Schedule Updated!');
                        forceFetch();
                        if (onSave) {
                            onSave();
                        }
                    })
                }
                onDelete={
                    data
                        ? () =>
                              DataDocScheduleResource.delete(docId).then(() => {
                                  forceFetch();
                                  if (onDelete) {
                                      onDelete();
                                  }
                              })
                        : null
                }
                onRun={
                    data
                        ? () =>
                              DataDocScheduleResource.run(docId).then(() => {
                                  toast.success('DataDoc execution started!');
                              })
                        : null
                }
            />
        );
    } else {
        // Readonly and no schedule
        return <EmptyText className="m24">No Schedules</EmptyText>;
    }
};

export const DataDocSchedule: React.FunctionComponent<
    IDataDocScheduleProps
> = ({ docId, isEditable, onSave, onDelete, currentTab }) => {
    const getHistoryDOM = () => (
        <div className="schedule-options">
            <DataDocScheduleRunLogs docId={docId} />
        </div>
    );

    const getScheduleDOM = () => (
        <DataDocScheduleFormWrapper
            docId={docId}
            isEditable={isEditable}
            onSave={onSave}
            onDelete={onDelete}
        />
    );

    return (
        <div className="DataDocSchedule">
            {currentTab === 'schedule' ? getScheduleDOM() : getHistoryDOM()}
        </div>
    );
};
