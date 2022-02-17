import React from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { ScheduleDataDocModal } from './ScheduleDataDocModal';

interface IProps {
    docId: number;
    isEditable: boolean;
}

export const ScheduleDataDocButton: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <div>
            <IconButton
                icon="clock"
                onClick={() => setShowModal(true)}
                tooltip="Schedule DataDoc"
                tooltipPos="left"
                title="Schedule"
            />
            {showModal ? (
                <ScheduleDataDocModal
                    docId={docId}
                    isEditable={isEditable}
                    onHide={() => setShowModal(false)}
                />
            ) : null}
        </div>
    );
};
