import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux/store/types';
import { SoftButton } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { DataDocSchedule } from 'components/DataDocSchedule/DataDocSchedule';

export const DataDocScheduleActionEdit: React.FunctionComponent<{
    docId: number;
    actionText?: string;
}> = ({ docId, actionText = 'Edit' }) => {
    const [showModal, setShowModal] = useState(false);
    const dispatch: Dispatch = useDispatch();

    return (
        <>
            {showModal && (
                <Modal
                    onHide={() => {
                        setShowModal(false);
                        dispatch(getScheduledDocs({}));
                    }}
                >
                    <div className="DataDocSchedule">
                        <DataDocSchedule
                            docId={docId}
                            isEditable={true}
                            currentTab={'schedule'}
                        />
                    </div>
                </Modal>
            )}
            <SoftButton onClick={() => setShowModal(true)}>
                {actionText}
            </SoftButton>
        </>
    );
};

export const DataDocScheduleActionHistory: React.FunctionComponent<{
    docId: number;
    actionText?: string;
}> = ({ docId, actionText = 'History' }) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            {showModal && (
                <Modal onHide={() => setShowModal(false)}>
                    <div className="schedule-options">
                        <DataDocSchedule
                            docId={docId}
                            isEditable={false}
                            currentTab={'history'}
                        />
                    </div>
                </Modal>
            )}
            <SoftButton onClick={() => setShowModal(true)}>
                {actionText}
            </SoftButton>
        </>
    );
};
