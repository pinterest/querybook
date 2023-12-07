import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import { navigateWithinEnv } from 'lib/utils/query-string';
import * as dataDocActions from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';

export function useDeleteDataDoc() {
    const dispatch: Dispatch = useDispatch();

    return useCallback(
        (docId: number) =>
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
        []
    );
}
