import React from 'react';
import ds from 'lib/datasource';

import { sendNotification } from 'lib/dataHubUI';
import { useDataFetch } from 'hooks/useDataFetch';
import { Loading } from 'ui/Loading/Loading';
import { ErrorMessage } from 'ui/Message/ErrorMessage';
import { Button } from 'ui/Button/Button';

import { DataDocScheduleForm } from './DataDocScheduleForm';
import { DataDocScheduleRunLogs } from './DataDocScheduleRunLogs';
import './DataDocSchedule.scss';
import { Tabs } from 'ui/Tabs/Tabs';
import { Title } from 'ui/Title/Title';
import { cronToRecurrence, getHumanReadableRecurrence } from 'lib/utils/cron';

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
    const { isLoading, isError, data, forceFetch } = useDataFetch({
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
        if (isEditable) {
            // When editable, make create/update form
            formDOM = (
                <DataDocScheduleForm
                    cron={data ? data.cron : null}
                    enabled={data ? data.enabled : false}
                    onCreate={(cron) =>
                        ds
                            .save(`/datadoc/${docId}/schedule/`, { cron })
                            .then(() => {
                                sendNotification('Schedule Created!');
                                forceFetch();
                                if (onSave) {
                                    onSave();
                                }
                            })
                    }
                    onUpdate={(cron, enabled) =>
                        ds
                            .update(`/datadoc/${docId}/schedule/`, {
                                cron,
                                enabled,
                            })
                            .then(() => {
                                sendNotification('Schedule Updated!');
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
                />
            );
        } else if (data) {
            // Readonly view
            const recurrence = cronToRecurrence(data.cron);
            const enabled = data.enabled;
            formDOM = (
                <div>
                    <p>Workflow {enabled ? 'Enabled' : 'Disabled'}</p>
                    <p>{getHumanReadableRecurrence(recurrence)}</p>
                </div>
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
