import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux/store/types';
import { SoftButton } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import { getScheduledDocs } from 'redux/scheduledDataDoc/action';
import { DataDocScheduleRunLogs } from 'components/DataDocSchedule/DataDocScheduleRunLogs';
import { DataDocScheduleFormWrapper } from 'components/DataDocSchedule/DataDocSchedule';

export const DataDocScheduleActionButtons: React.FunctionComponent<{
    docId: number;
}> = ({ docId }) => {
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const dispatch: Dispatch = useDispatch();

    return (
        <div>
            {showForm && (
                <Modal
                    onHide={() => {
                        setShowForm(false);
                        dispatch(getScheduledDocs({}));
                    }}
                >
                    <div className="DataDocSchedule">
                        <DataDocScheduleFormWrapper
                            docId={docId}
                            isEditable={true}
                        />
                    </div>
                </Modal>
            )}
            {showHistory && (
                <Modal onHide={() => setShowHistory(false)}>
                    <div className="schedule-options">
                        <DataDocScheduleRunLogs docId={docId} />
                    </div>
                </Modal>
            )}
            <SoftButton onClick={() => setShowForm(true)}>Edit</SoftButton>
            <SoftButton onClick={() => setShowHistory(true)}>
                History
            </SoftButton>
        </div>
    );
};
