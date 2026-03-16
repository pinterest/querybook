import React from 'react';
import { useDispatch } from 'react-redux';
import { cancelQueryExecution } from 'redux/queryExecutions/action';
import { Button } from 'ui/Button/Button';

interface ICancelBtnProps {
    queryExecutionId: number;
}

export const TaskCancelBtn: React.FunctionComponent<ICancelBtnProps> = ({
    queryExecutionId,
}) => {
    const dispatch = useDispatch();
    return (
        <Button
            className="ml8"
            title="Cancel"
            color="cancel"
            onClick={() => {
                dispatch(cancelQueryExecution(queryExecutionId));
            }}
        />
    );
};
