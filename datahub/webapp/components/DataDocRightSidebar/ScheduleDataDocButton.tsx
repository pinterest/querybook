import React from 'react';
import { DataDocSchedule } from 'components/DataDocSchedule/DataDocSchedule';

import { IconButton } from 'ui/Button/IconButton';
import { Modal } from 'ui/Modal/Modal';

interface IProps {
    docId: number;
    isEditable: boolean;
}

export const ScheduleDataDocButton: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
    const [showForm, setShowForm] = React.useState(false);
    const modal = showForm && (
        <Modal onHide={() => setShowForm(false)} title="Schedule DataDoc">
            <DataDocSchedule isEditable={isEditable} docId={docId} />
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
            {modal}
        </div>
    );
};
