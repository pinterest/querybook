import React from 'react';
import { DataDocSchedule } from 'components/DataDocSchedule/DataDocSchedule';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';
import { Tabs } from 'ui/Tabs/Tabs';
import { InfoButton } from 'ui/Button/InfoButton';

interface IProps {
    docId: number;
    isEditable: boolean;
}

const scheduleTabs = ['schedule', 'history'];

export type IScheduleTabs = typeof scheduleTabs[number];

export const ScheduleDataDocButton: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
    const [showForm, setShowForm] = React.useState(false);

    const [currentTab, setCurrentTab] = React.useState<IScheduleTabs>(
        'schedule'
    );

    const topDOM = (
        <div className="horizontal-space-between">
            <Tabs
                items={scheduleTabs}
                selectedTabKey={currentTab}
                onSelect={setCurrentTab}
            />
            <InfoButton layout={['left']}>
                Schedule your doc to be ran on a certain interval. Query cells
                will be executed one by one.
            </InfoButton>
        </div>
    );

    const modalDOM = showForm && (
        <Modal onHide={() => setShowForm(false)} topDOM={topDOM}>
            <DataDocSchedule
                isEditable={isEditable}
                docId={docId}
                currentTab={currentTab}
            />
        </Modal>
    );

    return (
        <div>
            <IconButton
                icon="clock"
                onClick={() => setShowForm(true)}
                tooltip="Schedule DataDoc"
                tooltipPos="left"
                title="Schedule"
            />
            {modalDOM}
        </div>
    );
};
