import { DataDocSchedule } from 'components/DataDocSchedule/DataDocSchedule';
import * as React from 'react';
import { InfoButton } from 'ui/Button/InfoButton';
import { Modal } from 'ui/Modal/Modal';
import { Tabs } from 'ui/Tabs/Tabs';

interface IProps {
    docId: number;
    isEditable: boolean;
    onHide: () => void;
}

const scheduleTabs = ['schedule', 'history'];

export type IScheduleTabs = typeof scheduleTabs[number];

export const DataDocScheduleModal: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
    onHide,
}) => {
    const [currentTab, setCurrentTab] = React.useState<IScheduleTabs>(
        'schedule'
    );

    const topDOM = (
        <div className="horizontal-space-between flex1">
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

    return (
        <Modal onHide={onHide} topDOM={topDOM}>
            <DataDocSchedule
                isEditable={isEditable}
                docId={docId}
                currentTab={currentTab}
            />
        </Modal>
    );
};
