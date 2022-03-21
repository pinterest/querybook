import React from 'react';
import { useDispatch } from 'react-redux';

import { TooltipDirection } from 'const/tooltip';

import { sendConfirm } from 'lib/querybookUI';
import { Dispatch } from 'redux/store/types';

import * as dataDocActions from 'redux/dataDoc/action';
import { IconButton } from 'ui/Button/IconButton';
import { navigateWithinEnv } from 'lib/utils/query-string';
import toast from 'react-hot-toast';

export interface IDeleteDataDocButtonProps {
    // from own Props
    docId: number;
    tooltipPos?: TooltipDirection;
    tooltip?: string;
}

export const DeleteDataDocButton: React.FunctionComponent<IDeleteDataDocButtonProps> = ({
    docId,
    tooltip = 'Delete',
    tooltipPos = 'left',
}) => {
    const dispatch: Dispatch = useDispatch();

    const handleDeleteDataDoc = React.useCallback(
        () =>
            sendConfirm({
                header: 'Delete DataDoc?',
                message: 'This action is irreversible.',
                onConfirm: () => {
                    toast.promise(
                        dispatch(dataDocActions.deleteDataDoc(docId)).then(() =>
                            navigateWithinEnv('/datadoc/')
                        ),
                        {
                            loading: 'Deleting DataDoc...',
                            success: 'DataDoc Deleted!',
                            error: 'Deletion failed',
                        }
                    );
                },
                confirmColor: 'cancel',
                cancelColor: 'default',
                confirmText: 'Confirm Deletion',
                confirmIcon: 'AlertOctagon',
            }),
        [docId]
    );

    return (
        <IconButton
            icon="Trash"
            tooltip={tooltip}
            tooltipPos={tooltipPos}
            onClick={handleDeleteDataDoc}
            title="Delete"
        />
    );
};
