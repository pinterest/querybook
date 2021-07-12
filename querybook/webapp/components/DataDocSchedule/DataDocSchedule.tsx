import React from 'react';
import ds from 'lib/datasource';
import toast from 'react-hot-toast';

import { useDataFetch } from 'hooks/useDataFetch';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';

import { DataDocScheduleForm } from './DataDocScheduleForm';
import { DataDocScheduleRunLogs } from './DataDocScheduleRunLogs';
import './DataDocSchedule.scss';
import { Tabs } from 'ui/Tabs/Tabs';
import { Title } from 'ui/Title/Title';
import { IDataDocTaskSchedule } from 'const/schedule';

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

export const DataDocSchedule: React.FunctionComponent<IDataDocScheduleProps> = ({
    docId,
    onSave,
    onDelete,
    isEditable,
}) => {
    const {
        isLoading,
        isError,
        data,
        forceFetch,
    } = useDataFetch<IDataDocTaskSchedule>({
        url: `/datadoc/${docId}/schedule/`,
    });
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
                        ds
                            .save(`/datadoc/${docId}/schedule/`, {
                                cron,
                                kwargs,
                            })
                            .then(() => {
                                toast.success('Schedule Created!');
                                forceFetch();
                                if (onSave) {
                                    onSave();
                                }
                            })
                    }
                    onUpdate={(cron, enabled, kwargs) =>
                        ds
                            .update(`/datadoc/${docId}/schedule/`, {
                                cron,
                                enabled,
                                kwargs,
                            })
                            .then(() => {
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
                                  ds
                                      .delete(`/datadoc/${docId}/schedule/`)
                                      .then(() => {
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
                                  ds
                                      .save(`/datadoc/${docId}/schedule/run/`)
                                      .then(() => {
                                          toast.success(
                                              'DataDoc execution started!'
                                          );
                                      })
                            : null
                    }
                />
            );
        } else {
            // Readonly and no schedule
            formDOM = (
                <div>
                    <Title>No Schedules</Title>
                </div>
            );
        }

        return formDOM;
    };

    return (
        <>
            {tabsDOM}
            <div className="DataDocSchedule">
                {currentTab === 'schedule' ? getScheduleDOM() : getHistoryDOM()}
            </div>
        </>
    );
};
