import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dispatch } from 'redux/store/types';
import { SoftButton } from 'ui/Button/Button';
import { Modal } from 'ui/Modal/Modal';
import * as dataDocActions from 'redux/dataDoc/action';
import { DataDocScheduleRunLogs } from 'components/DataDocSchedule/DataDocScheduleRunLogs';
import { DocScheduleForm } from 'components/DataDocSchedule/DataDocSchedule';

export const ActiveButtons: React.FunctionComponent<{ docId: number }> = ({
    docId,
}) => {
    const [showForm, setShowForm] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const dispatch: Dispatch = useDispatch();

    return (
        <div>
            {showForm && (
                <Modal
                    onHide={() => {
                        setShowForm(false);
                        dispatch(dataDocActions.getDataDocWithSchema({}));
                    }}
                    title="Schedule DataDoc"
                >
                    <div className="DataDocSchedule">
                        <DocScheduleForm docId={docId} isEditable={true} />
                    </div>
                </Modal>
            )}
            {showHistory && (
                <Modal
                    onHide={() => setShowHistory(false)}
                    title="History DataDoc"
                >
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
