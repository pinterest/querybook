import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { useDispatch } from 'react-redux';

import { ComponentType, ElementType } from 'const/analytics';
import { trackClick } from 'lib/analytics';
import { sendConfirm } from 'lib/querybookUI';
import { restoreDataDoc } from 'redux/dataDoc/action';
import { Dispatch } from 'redux/store/types';

export function useRestoreDataDoc() {
    const dispatch: Dispatch = useDispatch();

    const handleConfirm = useCallback(
        (docId: number, commitId: string, commitMessage: string) => () => {
            trackClick({
                component: ComponentType.GITHUB,
                element: ElementType.GITHUB_RESTORE_DATADOC_BUTTON,
            });

            toast.promise(
                dispatch(restoreDataDoc(docId, commitId, commitMessage)),
                {
                    loading: 'Restoring DataDoc...',
                    success: 'DataDoc has been successfully restored!',
                    error: 'Failed to restore DataDoc. Please try again.',
                }
            );
        },
        [dispatch]
    );

    return useCallback(
        async (
            docId: number,
            commitId: string,
            commitMessage: string
        ): Promise<void> => {
            sendConfirm({
                header: 'Restore DataDoc?',
                message:
                    'You are about to restore this DataDoc to the selected commit. Restoring will overwrite your current work. Please ensure you have committed any ongoing changes before proceeding.',
                onConfirm: handleConfirm(docId, commitId, commitMessage),
                confirmColor: 'cancel',
                cancelColor: 'default',
                confirmText: 'Confirm Restore',
                confirmIcon: 'AlertOctagon',
            });
        },
        [handleConfirm]
    );
}
