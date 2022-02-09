import React from 'react';
import toast from 'react-hot-toast';

import { useResource } from 'hooks/useResource';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

import { Tabs } from 'ui/Tabs/Tabs';
import { Title } from 'ui/Title/Title';
import { DataDocScheduleResource } from 'resource/dataDoc';

import { DataDocScheduleForm } from './DataDocScheduleForm';
import { DataDocScheduleRunLogs } from './DataDocScheduleRunLogs';
import './DataDocSchedule.scss';

interface IDataDocScheduleProps {
    docId: number;
    isEditable: boolean;
    onSave?: () => void;
    onDelete?: () => void;
}

const SCHEDULE_TABS = [
    {
        name: 'Schedule',
        key: 'schedule',
    },
    {
        name: 'History',
        key: 'history',
    },
];

export const DataDocScheduleFormWrapper: React.FunctionComponent<IDataDocScheduleProps> = ({
    docId,
    isEditable,
    onSave,
    onDelete,
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

    if (data || isEditable) {
        // When editable, make create/update form
        return (
            <DataDocScheduleForm
                isEditable={isEditable}
                docId={docId}
                cron={data?.cron ?? null}
                enabled={data?.enabled ?? false}
                kwargs={data?.kwargs ?? {}}
                onCreate={(cron, kwargs) =>
                    DataDocScheduleResource.create(docId, cron, kwargs).then(
                        () => {
                            toast.success('Schedule Created!');
                            forceFetch();
                            if (onSave) {
                                onSave();
                            }
                        }
                    )
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
        return (
            <div>
                <Title>No Schedules</Title>
            </div>
        );
    }
};

export const DataDocSchedule: React.FunctionComponent<IDataDocScheduleProps> = ({
    docId,
    onSave,
    onDelete,
    isEditable,
}) => {
    const [currentTab, setCurrentTab] = React.useState('schedule');

    const tabsDOM = (
        <div className="data-doc-schedule-tabs">
            <Tabs
                items={SCHEDULE_TABS}
                selectedTabKey={currentTab}
                onSelect={setCurrentTab}
                wide
            />
        </div>
    );

    const getHistoryDOM = () => (
        <div className="schedule-options">
            <DataDocScheduleRunLogs docId={docId} />
        </div>
    );

    return (
        <>
            {tabsDOM}
            <div className="DataDocSchedule">
                {currentTab === 'schedule' ? (
                    <DataDocScheduleFormWrapper
                        docId={docId}
                        isEditable={isEditable}
                        onSave={onSave}
                        onDelete={onDelete}
                    />
                ) : (
                    getHistoryDOM()
                )}
            </div>
        </>
    );
};
