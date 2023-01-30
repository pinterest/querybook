import React from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { ComponentType, ElementType } from 'const/analytics';
import { TooltipDirection } from 'const/tooltip';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import { navigateWithinEnv } from 'lib/utils/query-string';
import * as dataDocActions from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';
import { IconButton } from 'ui/Button/IconButton';

export interface IDeleteDataDocButtonProps {
    // from own Props
    docId: number;
    tooltipPos?: TooltipDirection;
    tooltip?: string;
}

export const DeleteDataDocButton: React.FunctionComponent<
    IDeleteDataDocButtonProps
> = ({ docId, tooltip = 'Delete', tooltipPos = 'left' }) => {
    const dispatch: Dispatch = useDispatch();

    const handleDeleteDataDoc = React.useCallback(
        () =>
            sendConfirm({
                header: 'Delete DataDoc?',
                message: 'This action is irreversible.',
                onConfirm: () => {
                    trackClick({
                        component: ComponentType.DATADOC_PAGE,
                        element: ElementType.DELETE_DATADOC_BUTTON,
                    });
                    toast.promise(
                        dispatch(dataDocActions.deleteDataDoc(docId)).then(() =>
                            navigateWithinEnv('/')
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
