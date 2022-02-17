import React from 'react';
import toast from 'react-hot-toast';

import { useResource } from 'hooks/useResource';
import { DataDocScheduleResource } from 'resource/dataDoc';
import { IScheduleTabs } from 'components/DataDocRightSidebar/ScheduleDataDocButton';

import { DataDocScheduleForm } from './DataDocScheduleForm';
import { DataDocScheduleRunLogs } from './DataDocScheduleRunLogs';

import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

import './DataDocSchedule.scss';

interface IDataDocScheduleProps {
    docId: number;
    isEditable: boolean;
    onSave?: () => void;
    onDelete?: () => void;
    currentTab: IScheduleTabs;
}

export const DataDocSchedule: React.FunctionComponent<IDataDocScheduleProps> = ({
    docId,
    onSave,
    onDelete,
    isEditable,
    currentTab,
}) => {
    const { isLoading, isError, data, forceFetch } = useResource(
        React.useCallback(() => DataDocScheduleResource.get(docId), [docId])
    );

    if (isLoading) {
        return <Loading />;
    }
    if (isError) {
        return <ErrorMessage>Error Loading DataDoc Schedule</ErrorMessage>;
    }

    const getHistoryDOM = () => (
        <div className="schedule-options">
            <DataDocScheduleRunLogs docId={docId} />
        </div>
    );

    const getScheduleDOM = () => {
        let formDOM = null;
        if (data || isEditable) {
            // When editable, make create/update form
            formDOM = (
                <DataDocScheduleForm
                    isEditable={isEditable}
                    docId={docId}
                    cron={data?.cron ?? null}
                    enabled={data?.enabled ?? false}
                    kwargs={data?.kwargs ?? {}}
                    onCreate={(cron, kwargs) =>
                        DataDocScheduleResource.create(
                            docId,
                            cron,
                            kwargs
                        ).then(() => {
                            toast.success('Schedule Created!');
                            forceFetch();
                            if (onSave) {
                                onSave();
                            }
                        })
                    }
                    onUpdate={(cron, enabled, kwargs) =>
                        DataDocScheduleResource.update(docId, {
                            cron,
                            enabled,
                            kwargs,
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
                                  DataDocScheduleResource.delete(docId).then(
                                      () => {
                                          forceFetch();
                                          if (onDelete) {
                                              onDelete();
                                          }
                                      }
                                  )
                            : null
                    }
                    onRun={
                        data
                            ? () =>
                                  DataDocScheduleResource.run(docId).then(
                                      () => {
                                          toast.success(
                                              'DataDoc execution started!'
                                          );
                                      }
                                  )
                            : null
                    }
                />
            );
        } else {
            // Readonly and no schedule
            formDOM = <div className="empty-message m16">No Schedules</div>;
        }

        return formDOM;
    };

    return (
        <div className="DataDocSchedule">
            {currentTab === 'schedule' ? getScheduleDOM() : getHistoryDOM()}
        </div>
    );
};
