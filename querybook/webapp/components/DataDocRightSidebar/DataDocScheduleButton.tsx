import React from 'react';

import { IconButton } from 'ui/Button/IconButton';
import { DataDocScheduleModal } from './DataDocScheduleModal';

interface IProps {
    docId: number;
    isEditable: boolean;
}

export const DataDocScheduleButton: React.FunctionComponent<IProps> = ({
    docId,
    isEditable,
}) => {
    const [showModal, setShowModal] = React.useState(false);

    return (
        <div>
            <IconButton
                icon="Clock"
                onClick={() => setShowModal(true)}
                tooltip="Schedule DataDoc"
                tooltipPos="left"
                title="Schedule"
            />
            {showModal ? (
                <DataDocScheduleModal
                    docId={docId}
                    isEditable={isEditable}
                    onHide={() => setShowModal(false)}
                />
            ) : null}
        </div>
    );
};
